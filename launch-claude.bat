@echo off
echo Starting Claude in %1
echo Project: %3
echo Agent: %2
echo Command: %4

REM Change to the project directory
cd /d "%1"

REM Set the window title
title "%3 - %2 - %time:~0,5%"

REM Launch Claude with or without a specific command
if "%4"=="" (
    echo Launching plain Claude
    start "Claude" /D "%1" cmd /k "title %3 - %2 - %time:~0,5% && claude --dangerously-skip-permissions"
) else (
    echo Launching Claude with command: %4
    start "Claude Agent" /D "%1" cmd /k "title %3 - %2 - %time:~0,5% && claude --dangerously-skip-permissions \"%4\""
)

echo Claude launch initiated