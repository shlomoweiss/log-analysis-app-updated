import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import requests
import json

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="CrewAI Log Query Service Connector")

# Configure service URLs
CREWAI_SERVICE_URL = os.getenv("CREWAI_SERVICE_URL", "http://localhost:8000")

class QueryRequest(BaseModel):
    natural_language_query: str
    index_pattern: Optional[str] = "logs-*"
    time_range: Optional[Dict[str, str]] = None
    additional_context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    elasticsearch_query: Dict[str, Any]
   

@app.post("/proxy-query", response_model=QueryResponse)
async def proxy_query(query_request: QueryRequest):
    """
    Proxy the query to the CrewAI service and return the response.
    This service acts as a bridge between the Node.js backend and the Python CrewAI service.
    """
    try:
        # Forward the request to the CrewAI service
        response = requests.post(
            f"{CREWAI_SERVICE_URL}/translate-query",
            json=query_request.model_dump(),
            headers={"Content-Type": "application/json"},
            timeout=9000
        )
        
        
        # Return the response from the CrewAI service
        return response.json()
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with CrewAI service: {str(e)}")

@app.get("/health")
async def health_check():
    """
    Check the health of both this service and the CrewAI service.
    """
    try:
        # Check the health of the CrewAI service
        crewai_health = requests.get(f"{CREWAI_SERVICE_URL}/health")
        crewai_health.raise_for_status()
        
        return {
            "status": "healthy",
            "service": "crewai-connector",
            "crewai_service": crewai_health.json()
        }
    except requests.exceptions.RequestException:
        return {
            "status": "degraded",
            "service": "crewai-connector",
            "crewai_service": "unavailable"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
