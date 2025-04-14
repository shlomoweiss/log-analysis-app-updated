@echo off
REM Start script for the CrewAI Log Query Service
REM This script starts both the main CrewAI service and the connector service

REM Set environment variables
set OPENAI_API_KEY=your-api-key-here
set CREWAI_SERVICE_URL=http://localhost:8000
set CREWAI_CONNECTOR_URL=http://localhost:8001

REM Create log directory if it doesn't exist
if not exist logs mkdir logs

echo Starting CrewAI Log Query Service...
cd /d "%~dp0"

REM Start the main CrewAI service
echo Starting main CrewAI service on port 8000...
start /b cmd /c "python app.py > logs\crewai_service.log 2>&1"
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list ^| findstr "PID"') do set MAIN_PID=%%a
echo Main CrewAI service started with PID: %MAIN_PID%

REM Wait a moment for the main service to initialize
timeout /t 5 /nobreak > nul

REM Start the connector service
echo Starting connector service on port 8001...
start /b cmd /c "python connector.py > logs\connector_service.log 2>&1"
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list ^| findstr "PID"') do (
    if not "%%a"=="%MAIN_PID%" set CONNECTOR_PID=%%a
)
echo Connector service started with PID: %CONNECTOR_PID%

echo Both services are running. Check logs directory for output.
echo To stop the services, run: taskkill /PID %MAIN_PID% /PID %CONNECTOR_PID% /F

REM Save PIDs to file for easy shutdown
echo %MAIN_PID% %CONNECTOR_PID% > logs\service_pids.txt

echo Service PIDs saved to logs\service_pids.txt

REM Create a stop script for convenience
echo @echo off > stop_services.bat
echo REM Script to stop CrewAI services >> stop_services.bat
echo echo Stopping CrewAI services... >> stop_services.bat
echo if exist logs\service_pids.txt ( >> stop_services.bat
echo   for /f "tokens=1,2" %%%%a in (logs\service_pids.txt) do ( >> stop_services.bat
echo     taskkill /PID %%%%a /F 2>nul >> stop_services.bat
echo     taskkill /PID %%%%b /F 2>nul >> stop_services.bat
echo   ) >> stop_services.bat
echo   echo Services stopped. >> stop_services.bat
echo ) else ( >> stop_services.bat
echo   echo No service PIDs found. Services may not be running. >> stop_services.bat
echo ) >> stop_services.bat

echo Created stop_services.bat for easy shutdown