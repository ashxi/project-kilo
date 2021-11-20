@echo off
set /p URL=%CD%
cd tooling\usefulcommit
node index.js %*
cd %URL%