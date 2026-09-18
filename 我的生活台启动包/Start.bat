@echo off
setlocal
title My Life Workbench
rem Launcher for the personal workbench.
rem Priority: open the live workspace file (always up to date),
rem otherwise open the HTML copy sitting next to this .bat.

set "MAIN=D:\WorkBuddy_Project\Personal_workbench_03\personal-workbench.html"
set "LOCAL="

for %%f in ("%~dp0*.html") do set "LOCAL=%%f"

if exist "%MAIN%" (
  start "" "%MAIN%"
  goto :eof
)

if defined LOCAL (
  start "" "%LOCAL%"
  goto :eof
)

echo [ERROR] Workbench HTML not found.
echo Please keep this .bat in the same folder as the HTML file,
echo or reinstall the project at: %MAIN%
echo.
pause
