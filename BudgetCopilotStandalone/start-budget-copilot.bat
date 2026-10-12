@echo off
setlocal
cd /d "%~dp0"

echo Starting Budget Copilot local proxy...
echo.
echo Open this URL in your browser:
echo http://localhost:8087/budget-copilot.html
echo.

node scripts\budget-copilot-proxy.js

echo.
echo The proxy stopped. Press any key to close this window.
pause >nul
