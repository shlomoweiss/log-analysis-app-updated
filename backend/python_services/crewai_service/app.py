import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

import json
import re


# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="CrewAI Log Query Service")

# Configure OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key")

# Initialize LLM
llm = ChatOpenAI(
    model="gemma-2-9b-it",
    temperature=0,
    base_url="http://192.168.1.191:1234/v1",
    api_key=OPENAI_API_KEY
)
"""""
llm = ChatOpenAI(
    model="google/gemini-2.5-pro-exp-03-25:free",
    temperature=0,
    base_url="https://openrouter.ai/api/v1",
    api_key=""
)
"""
class QueryRequest(BaseModel):
    natural_language_query: str
    index_pattern: Optional[str] = "logs-*"
    time_range: Optional[Dict[str, str]] = None
    additional_context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    elasticsearch_query: Dict[str, Any]
   

# --- Utility function to summarize indicesFields for prompt context ---
def summarize_indices_fields(indices_fields):
    """Format the indicesFields structure as a readable summary for LLM context."""
    if not indices_fields:
        return "No index fields information provided."
    if isinstance(indices_fields, dict):
        summary_lines = []
        for field, meta in indices_fields.items():
            type_info = meta.get("type") if isinstance(meta, dict) else str(meta)
            summary_lines.append(f"- {field}: {type_info}")
        return "\n".join(summary_lines)
    elif isinstance(indices_fields, list):
        return ", ".join(str(f) for f in indices_fields)
    else:
        return str(indices_fields)

#--- Prompts ---
ANALYSIS_PROMPT = PromptTemplate.from_template(
    """
Analyze the following natural language query about logs:
"{query}"

Index Fields available for this query (names and types):
{indices_fields_context}

Identify:
1. The time range (if specified)
2. Log levels of interest (ERROR, WARN, INFO, DEBUG)
3. Services or components mentioned
4. Specific error types or conditions
5. Any aggregations or analytics requested

Restrict your reasoning to use only fields present in the above index fields if possible.
Respond in structured bullet points as a numbered list.
"""
)

TRANSLATION_PROMPT = PromptTemplate.from_template(
    """
Based on the following analysis:
{analysis}

Natural language query:
"{query}"

Index Fields available for query generation (names and types):
{indices_fields_context}

Translate the above query into an Elasticsearch DSL query that will search for logs in the index pattern: {index_pattern}

Instructions:
- Use ONLY the fields present in the above index fields listing.
- Add time range, log level, service/component, and message content filters as needed.
- Use aggregations only on listed fields.

The query should be in valid JSON format that can be directly used with Elasticsearch.
Respond only with the JSON.
"""
)

OPTIMIZATION_PROMPT = PromptTemplate.from_template(
    """
Given this Elasticsearch query in JSON format:
{es_query}

Index Fields available for this query (names and types):
{indices_fields_context}

Review and optimize the query for:
1. Performance (avoid wildcard prefixes, use appropriate field types)
2. Accuracy (ensure it matches the user's intent and available fields)
3. Completeness (include all relevant filters)
4. Best practices (follow Elasticsearch query best practices)
5. if it aggregations query set query size to 0 else set query size to 10000
6. make sure @timestamp is one on return fields
7. very importent!!! do not remove any fields from the given Elasticsearch query result, the optimization should not change the given query result or try to reduce the amount of data the query return

Respond in the following format:

```json
<the optimized Elasticsearch query, valid JSON>
```


"""
)

FIX_QUERY_PROMPT = PromptTemplate.from_template(
    """
Given this Elasticsearch query in JSON format:
{es_query}

Index Fields available for this query (names and types):
{indices_fields_context}
getting this error:
{error_message}
fix the query  and respond in the following format:
```json
<the fixed Elasticsearch query, valid JSON>
```
"""
)

def extract_json_from_string(input_string):
    """
    Extract a JSON object from a string that might contain other content.
    The function looks for content between ```json and ``` markers.
    If not found, it tries to find any JSON-like content enclosed in braces {}.
    
    Args:
        input_string (str): The input string containing JSON somewhere within it
        
    Returns:
        dict: The parsed JSON object or None if no valid JSON is found
    """
    # Try to find content between markdown JSON code blocks first
    json_block_pattern = r'```json\s*([\s\S]*?)\s*```'
    match = re.search(json_block_pattern, input_string)
    
    if match:
        # Found JSON in code block
        json_str = match.group(1)
    else:
        # Try to find JSON content enclosed in braces
        brace_pattern = r'({[\s\S]*?})'
        match = re.search(brace_pattern, input_string)
        if match:
            json_str = match.group(1)
        else:
            print("No JSON content found in the string")
            return None
    
    try:
        json_str = json_str.replace('\\n', '')
        json_str = json_str.replace("\'", "\"")
        print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"+json_str)
        # Parse the JSON string into a Python dictionary
        json_obj = json.loads(json_str)
        return json_obj
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None

@app.post("/translate-query", response_model=QueryResponse)
async def translate_query(query_request: QueryRequest):
        print ("in translate_query")
        
        # Extract indices fields from additional context if available
        indices_fields = None
        if query_request.additional_context and "indicesFields" in query_request.additional_context:
            indices_fields = query_request.additional_context["indicesFields"]
            print(f"[translate_query] indicesFields received: {type(indices_fields)} - {list(indices_fields.keys()) if isinstance(indices_fields, dict) else str(indices_fields)}")
        
        # Format indices fields for prompt context
        indices_fields_context = summarize_indices_fields(indices_fields)

        print("******************************************************************")
        print ("indices_fields_context = " + indices_fields_context)
        print("******************************************************************")
    
        # 1. Analyze user's intent & details using prompt | llm pattern
        analysis_chain = ANALYSIS_PROMPT | llm
        analysis_result = await analysis_chain.ainvoke(
            {
                "query": query_request.natural_language_query,
                "indices_fields_context": indices_fields_context
            }
        )
        
        if isinstance(analysis_result, dict):
            analysis_result = analysis_result.get("content", str(analysis_result))
        else:
            analysis_result = str(analysis_result)
        

        print (analysis_result)
        print("*********************************************************************")
        # 2. Translate analysis to Elasticsearch DSL
        translation_chain = TRANSLATION_PROMPT | llm
        translation_result = await translation_chain.ainvoke(
            {
                "analysis": analysis_result,
                "query": query_request.natural_language_query,
                "index_pattern": query_request.index_pattern,
                "indices_fields_context": indices_fields_context
            }
        )
        
        if isinstance(translation_result, dict):
            translation_result = translation_result.get("content", str(translation_result))
        else:
            translation_result = str(translation_result)


        print (translation_result)
        print("************************************************************************")
        # 3. Optimize Elasticsearch query
        optimization_chain = OPTIMIZATION_PROMPT | llm
        opt_result = await optimization_chain.ainvoke({
            "es_query": translation_result,
            "indices_fields_context": indices_fields_context
        })
        print (opt_result)
        
        if isinstance(opt_result, dict):
            opt_result = opt_result.get("content", str(opt_result))
        else:
            opt_result = str(opt_result)

        
        elasticsearch_query = extract_json_from_string(str(opt_result))

        if (elasticsearch_query):
            print("Successfully extracted JSON:")
            print(json.dumps(elasticsearch_query, indent=2))
        else:
           print("Could not extract Elasticsearch query from result use translation result") 
           elasticsearch_query = extract_json_from_string(str(translation_result))
        
        return QueryResponse(
            elasticsearch_query=elasticsearch_query,
        )
   
@app.post("/fix-query",response_model=QueryResponse)
async def fix_query(query_request: QueryRequest):
    print ("in fix_query")
    
    # Extract indices fields from additional context if available
    indices_fields = None
    if query_request.additional_context and "indicesFields" in query_request.additional_context:
        indices_fields = query_request.additional_context["indicesFields"]
        print(f"[fix_query] indicesFields received: {type(indices_fields)} - {list(indices_fields.keys()) if isinstance(indices_fields, dict) else str(indices_fields)}")
    
    # Format indices fields for prompt context
    indices_fields_context = summarize_indices_fields(indices_fields)

    print("******************************************************************")
    print ("indices_fields_context = " + indices_fields_context)
    print("******************************************************************")

    # 1. Fix the Elasticsearch query
    fix_chain = FIX_QUERY_PROMPT | llm
    fix_result = await fix_chain.ainvoke(
        {
            "es_query": query_request.additional_context["DslQuery"],
            "error_message": query_request.additional_context["ErrorMessage"],
            "indices_fields_context": indices_fields_context
        }
    )
    
    if isinstance(fix_result, dict):
        fix_result = fix_result.get("content", str(fix_result))
    else:
        fix_result = str(fix_result)

    
    elasticsearch_query = extract_json_from_string(str(fix_result))

    if (elasticsearch_query):
        print("Successfully extracted JSON:")
        print(json.dumps(elasticsearch_query, indent=2))
    else:
       print("Could not extract Elasticsearch query from result use translation result") 
       elasticsearch_query = {
          "query": {
           "match_all": {}
          },
          "size": 1,
          "_source": True
       }
    
    return QueryResponse(
        elasticsearch_query=elasticsearch_query,
    )
    
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "langchain-log-query-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
