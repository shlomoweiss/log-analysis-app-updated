@echo off 
REM Script to stop CrewAI services 
echo Stopping CrewAI services... 
if exist logs\service_pids.txt ( 
  for /f "tokens=1,2" %%a in (logs\service_pids.txt) do ( 
    taskkill /PID %%a /F 
    taskkill /PID %%b /F 
  ) 
  echo Services stopped. 
) else ( 
  echo No service PIDs found. Services may not be running. 
) 
