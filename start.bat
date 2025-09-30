@echo off
ECHO Starting the development server in Windows Terminal tabs...

:: Save current directory
set CURRENT_DIR=%cd%

:: Open backend in new CMD tab
wt -w 0 nt -p "Command Prompt" -d "%CURRENT_DIR%\backend" cmd /k "nodemon index.js"

:: Open frontend in new CMD tab
wt -w 0 nt -p "Command Prompt" -d "%CURRENT_DIR%\frontend" cmd /k "npm run dev"

ECHO Both backend and frontend are running in new CMD tabs.
