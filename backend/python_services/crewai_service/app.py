import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="CrewAI Log Query Service")

# Configure OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key")

# Initialize LLM
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0,
    api_key=OPENAI_API_KEY
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

# Define CrewAI agents
def create_query_translator_agent():
    return Agent(
        role="Elasticsearch Query Translator",
        goal="Translate natural language queries into precise Elasticsearch DSL queries",
        backstory="""You are an expert in Elasticsearch and log analysis. 
        Your job is to understand user questions about logs and translate them 
        into Elasticsearch DSL queries that will retrieve the relevant information.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

def create_log_analyst_agent():
    return Agent(
        role="Log Analysis Expert",
        goal="Analyze log patterns and provide context for queries",
        backstory="""You are a seasoned log analyst with deep expertise in 
        system troubleshooting and log interpretation. You understand common 
        log formats and can identify patterns that indicate issues.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

def create_query_optimizer_agent():
    return Agent(
        role="Query Optimizer",
        goal="Optimize Elasticsearch queries for performance and accuracy",
        backstory="""You are an Elasticsearch performance expert. Your job is to 
        review queries and optimize them to ensure they are efficient, accurate, 
        and follow best practices.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

# Define tasks
def create_tasks(query_request: QueryRequest):
    translator_agent = create_query_translator_agent()
    analyst_agent = create_log_analyst_agent()
    optimizer_agent = create_query_optimizer_agent()
    
    understanding_task = Task(
        description=f"""
        Analyze the following natural language query about logs:
        "{query_request.natural_language_query}"
        
        Identify:
        1. The time range (if specified)
        2. Log levels of interest (ERROR, WARN, INFO, DEBUG)
        3. Services or components mentioned
        4. Specific error types or conditions
        5. Any aggregations or analytics requested
        
        Additional context: {query_request.additional_context}
        """,
        agent=analyst_agent,
        expected_output="A detailed analysis of the query components and intent"
    )
    
    translation_task = Task(
        description=f"""
        Based on the analysis, translate the natural language query:
        "{query_request.natural_language_query}"
        
        Into an Elasticsearch DSL query that will search for logs in the index pattern: {query_request.index_pattern}
        
        Consider:
        - Time range filters
        - Log level filters
        - Service/component filters
        - Message content filters
        - Any aggregations needed
        
        The query should be in valid JSON format that can be directly used with Elasticsearch.
        """,
        agent=translator_agent,
        expected_output="A complete Elasticsearch DSL query in JSON format",
        context=[understanding_task]
    )
    
    optimization_task = Task(
        description="""
        Review and optimize the Elasticsearch query for:
        1. Performance (avoid wildcard prefixes, use appropriate field types)
        2. Accuracy (ensure it matches the user's intent)
        3. Completeness (include all relevant filters)
        4. Best practices (follow Elasticsearch query best practices)
        
        Provide the optimized query in JSON format along with an explanation of your optimizations.
        """,
        agent=optimizer_agent,
        expected_output="An optimized Elasticsearch DSL query with explanation",
        context=[translation_task]
    )
    
    return [understanding_task, translation_task, optimization_task]

@app.post("/translate-query", response_model=QueryResponse)
async def translate_query(query_request: QueryRequest):
    try:
        # Create agents and tasks
        tasks = create_tasks(query_request)
        
        # Create and run the crew
        crew = Crew(
            agents=[create_query_translator_agent(), create_log_analyst_agent(), create_query_optimizer_agent()],
            tasks=tasks,
            verbose=2,
            process=Process.sequential
        )
        
        # Execute the crew
        result = crew.kickoff()
        
        # Parse the final result to extract the Elasticsearch query
        # This assumes the optimizer agent returns a JSON string containing the query
        import json
        import re
        
        # Extract JSON from the result using regex
        json_pattern = r'```json\n(.*?)\n```'
        json_matches = re.findall(json_pattern, result, re.DOTALL)
        
        if json_matches:
            elasticsearch_query = json.loads(json_matches[0])
        else:
            # Fallback: try to find any JSON-like structure
            json_pattern = r'\{.*\}'
            json_matches = re.findall(json_pattern, result, re.DOTALL)
            if json_matches:
                elasticsearch_query = json.loads(json_matches[0])
            else:
                raise ValueError("Could not extract Elasticsearch query from result")
        
        # Extract explanation
        explanation_pattern = r'Explanation:(.*?)(?=\n\n|$)'
        explanation_matches = re.findall(explanation_pattern, result, re.DOTALL)
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
    return {"status": "healthy", "service": "crewai-log-query-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
