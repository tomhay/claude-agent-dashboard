# Warp Terminal & Git Integration Fixes

## Problem: "Terminal is not fully functional" Warning

The warning `WARNING: terminal is not fully functional` occurs when Git tries to use a pager (like `less`) in non-interactive contexts, particularly when run through Node.js exec commands.

## Solution Applied

### 1. Global Git Configuration
Disabled pagers for all common Git commands:

```bash
git config --global pager.branch false
git config --global pager.log false  
git config --global pager.diff false
git config --global pager.show false
git config --global pager.status false
git config --global core.pager cat
```

### 2. Consistent --no-pager Usage
All Git commands in the application now use `--no-pager` flag when appropriate:

```javascript
// Good
git --no-pager log --oneline -5

// Also works now due to global config
git log --oneline -5
```

## Warp Agent Launcher Enhancement

### Problem: Opening Agents in Tmux
The original Warp launcher opened agents directly in terminal tabs, which could block the interface.

### Solution: Tmux Session Management
Enhanced the Warp launcher (`app/api/launch-warp-agent/route.ts`) to:

1. **Create named tmux sessions** for each agent: `projectname-agentname`
2. **Reuse existing sessions** if the agent is already running
3. **Attach to sessions** instead of creating new processes

### Benefits
- ✅ Non-blocking: Agents run in background tmux sessions
- ✅ Persistent: Sessions survive terminal closures  
- ✅ Reattachable: Can reconnect to running agents
- ✅ Isolated: Each agent has its own session
- ✅ Project-aware: Sessions named by project and agent

### Usage
When you click the ⚡ (Warp) button in the dashboard:

1. **First time**: Creates new tmux session and starts agent
2. **Subsequent clicks**: Attaches to existing session
3. **Session naming**: `balilove-sod`, `aibl-eod`, etc.

### Manual Tmux Commands
You can also manage sessions manually:

```bash
# List all agent sessions
tmux list-sessions

# Attach to specific agent
tmux attach-session -t balilove-sod

# Kill a session
tmux kill-session -t balilove-sod

# Create detached session
tmux new-session -d -s my-agent-session
```

## Environment Requirements

For optimal functionality, ensure:

1. **Tmux installed**: `winget install tmux` (Windows) or package manager
2. **Warp terminal installed**: https://www.warp.dev/download
3. **Claude CLI available**: In your PATH

## Testing the Fix

Run these commands to verify the fixes:

```bash
# Should work without warnings
git branch
git log --oneline -3
git status

# Should work with explicit flag
git --no-pager branch
```

## Troubleshooting

### If pager warnings persist:
```bash
# Check your Git config
git config --list | grep pager

# Reset if needed
git config --global --unset core.pager
git config --global core.pager cat
```

### If tmux sessions don't start:
```bash
# Install tmux (Windows)
winget install tmux

# Test tmux
tmux new-session -d -s test
tmux list-sessions
tmux kill-session -t test
```

### If Warp doesn't launch:
- Verify installation: https://www.warp.dev/download
- Check PATH: `where warp` or `Get-Command warp`
- Try manual launch first

---
*Updated: 2025-09-02*
*Related: Issue #2 - Workflow testing and professional Git practices*
