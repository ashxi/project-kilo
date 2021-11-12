@echo off
echo [init] Starting maker in WSL...
wsl ./maker.sh
echo [init] Autorunning npm install...
cd ..
echo npm install ^&^& exit > %temp%\tmake.bat
start /wait %temp%\tmake.bat
cd tooling