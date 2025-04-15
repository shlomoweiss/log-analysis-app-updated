import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="CrewAI Log Query Service")

# Configure OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key")

# Initialize LLM
#llm = ChatOpenAI(
#    model="soob3123_amoral-gemma3-12b-v2",
#    temperature=0,
#    base_url="http://192.168.1.191:1234/v1",
#    api_key=OPENAI_API_KEY
#)
llm = ChatOpenAI(
   model="gemini-2.5-pro-exp-03-25:free",
    temperature=0,
    base_url="https://openrouter.ai/api/v1",
    api_key="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"
)
class QueryRequest(BaseModel):
    natural_language_query: str
    index_pattern: Optional[str] = "logs-*"
    time_range: Optional[Dict[str, str]] = None
    additional_context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    elasticsearch_query: Dict[str, Any]
    explanation: str
    confidence_score: float

#--- Prompts ---
ANALYSIS_PROMPT = PromptTemplate.from_template(
    """
Analyze the following natural language query about logs:
"{query}"
Identify:
1. The time range (if specified)
2. Log levels of interest (ERROR, WARN, INFO, DEBUG)
3. Services or components mentioned
4. Specific error types or conditions
5. Any aggregations or analytics requested

Respond in structured bullet points as a numbered list.
"""
)

TRANSLATION_PROMPT = PromptTemplate.from_template(
    """
Based on the following analysis:\n{analysis}

Translate the following natural language query:
"{query}"

Into an Elasticsearch DSL query that will search for logs in the index pattern: {index_pattern}

Consider:
- Time range filters
- Log level filters
- Service/component filters
- Message content filters
- Any aggregations needed

The query should be in valid JSON format that can be directly used with Elasticsearch. Respond only with the JSON.
"""
)

OPTIMIZATION_PROMPT = PromptTemplate.from_template(
    """
Given this Elasticsearch query in JSON format:
{es_query}

Review and optimize the query for:
1. Performance (avoid wildcard prefixes, use appropriate field types)
2. Accuracy (ensure it matches the user's intent)
3. Completeness (include all relevant filters)
4. Best practices (follow Elasticsearch query best practices)

Respond in the following format:

```json
<the optimized Elasticsearch query, valid JSON>
```

Explanation: <one or two paragraphs explaining improvements, if any>
"""
)


@app.post("/translate-query", response_model=QueryResponse)
async def translate_query(query_request: QueryRequest):
    print ("in translate_query")
    try:
        # 1. Analyze user's intent & details using prompt | llm pattern
        analysis_chain = ANALYSIS_PROMPT | llm
        analysis_result = await analysis_chain.ainvoke(
            {"query": query_request.natural_language_query}
        )
        
        if isinstance(analysis_result, dict):
            analysis_result = analysis_result.get("content", str(analysis_result))
        else:
            analysis_result = str(analysis_result)
        

        print ("analysis result = " + analysis_result)
        # 2. Translate analysis to Elasticsearch DSL
        translation_chain = TRANSLATION_PROMPT | llm
        translation_result = await translation_chain.ainvoke(
            {
                "analysis": analysis_result,
                "query": query_request.natural_language_query,
                "index_pattern": query_request.index_pattern
            }
        )
        
        if isinstance(translation_result, dict):
            translation_result = translation_result.get("content", str(translation_result))
        else:
            translation_result = str(translation_result)


        print ("translation result = " + translation_result)
        # 3. Optimize Elasticsearch query
        optimization_chain = OPTIMIZATION_PROMPT | llm
        opt_result = await optimization_chain.ainvoke({"es_query": translation_result})
        
        if isinstance(opt_result, dict):
            opt_result = opt_result.get("content", str(opt_result))
        else:
            opt_result = str(opt_result)


        print ("opt resulst =" + opt_result)
        # Parse the optimized query and explanation
        import json
        import re

        # Extract JSON from the result using regex
        json_pattern = r'```json\n(.*?)\n```'
        json_matches = re.findall(json_pattern, opt_result, re.DOTALL)
        
        if json_matches:
            elasticsearch_query = json.loads(json_matches[0])
        else:
            # Fallback: try to find any JSON-like structure
            json_pattern = r'\{.*\}'
            json_matches = re.findall(json_pattern, opt_result, re.DOTALL)
            if json_matches:
                elasticsearch_query = json.loads(json_matches[0])
            else:
                raise ValueError("Could not extract Elasticsearch query from result")
        
        # Extract explanation
        explanation_pattern = r'Explanation:(.*?)(?=\n\n|$)'
        explanation_matches = re.findall(explanation_pattern, opt_result, re.DOTALL)
        explanation = explanation_matches[0].strip() if explanation_matches else "Query optimized for performance and accuracy."
        
        # Calculate a confidence score (mock implementation)
        confidence_score = 0.95  # High confidence by default
        
        return QueryResponse(
            elasticsearch_query=elasticsearch_query,
            explanation=explanation,
            confidence_score=confidence_score
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error translating query: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "langchain-log-query-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
