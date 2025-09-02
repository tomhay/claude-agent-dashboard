@echo off
REM Launch agent with specific command in new terminal
REM Args: %1=project_path %2=agent_command %3=window_title

echo Launching agent in new terminal...
echo Project: %1
echo Command: %2  
echo Title: %3

REM Launch new terminal window with agent
start "%3" /D "%1" cmd.exe /k "title %3 && claude --dangerously-skip-permissions"

echo Agent terminal launched with title: %3