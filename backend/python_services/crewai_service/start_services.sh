#!/bin/bash

# Start script for the CrewAI Log Query Service
# This script starts both the main CrewAI service and the connector service

# Set environment variables
export OPENAI_API_KEY="your-api-key-here"
export CREWAI_SERVICE_URL="http://localhost:8000"
export CREWAI_CONNECTOR_URL="http://localhost:8001"

# Create log directory
mkdir -p logs

echo "Starting CrewAI Log Query Service..."
cd "$(dirname "$0")"

# Start the main CrewAI service
echo "Starting main CrewAI service on port 8000..."
python3 app.py > logs/crewai_service.log 2>&1 &
MAIN_PID=$!
echo "Main CrewAI service started with PID: $MAIN_PID"

# Wait a moment for the main service to initialize
sleep 5

# Start the connector service
echo "Starting connector service on port 8001..."
python3 connector.py > logs/connector_service.log 2>&1 &
CONNECTOR_PID=$!
echo "Connector service started with PID: $CONNECTOR_PID"

echo "Both services are running. Check logs directory for output."
echo "To stop the services, run: kill $MAIN_PID $CONNECTOR_PID"

# Save PIDs to file for easy shutdown
echo "$MAIN_PID $CONNECTOR_PID" > logs/service_pids.txt

echo "Service PIDs saved to logs/service_pids.txt"
