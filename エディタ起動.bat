@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo const ASSETS_LIST = [ > js\assets_list.js
for /f "delims=" %%a in ('dir /s /b /a-d "assets\*.png"') do (
    set "filepath=%%a"
    setlocal EnableDelayedExpansion
    set "relpath=!filepath:%CD%\=!"
    set "relpath=!relpath:\=/!"
    echo "!relpath!", >> js\assets_list.js
    endlocal
)
echo ]; >> js\assets_list.js
start map-editor.html
