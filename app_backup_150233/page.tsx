'use client'

import { useState, useEffect } from 'react'
import { Play, Clock, Terminal, Eye, GitBranch, ExternalLink, User, Tag } from 'lucide-react'
import IssuesTable from './components/IssuesTable'

interface Agent {
  id: string
  name: string
  project: string
  type: 'daily' | 'workflow' | 'core' | 'ticket'
  lastRun?: Date
  status: 'idle' | 'running' | 'completed' | 'failed'
  path: string
}

interface RunningTerminal {
  processId: number
  windowTitle: string
  agentName: string
  projectPath: string
  startTime: Date
}

interface GitInfo {
  project: string
  branch: string | null
  githubUrl: string | null
  hasGit: boolean
}

interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string
  project: string
  repoName: string
  labels: string[]
  assignee: string | null
  state: string
  created_at: string
  updated_at: string
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
  stage: string
  assignedAgent: string | null
}

const agentPrompts: Record<string, string> = {
  'universal-sod-reviewer': 'Review all SOD agents across projects. Read each project CLAUDE.md, analyze SOD agent effectiveness, and update SOD agents to be more project-specific and relevant.',
  'universal-agent-updater': 'Scan all .claude/agents/ directories across projects, analyze agent effectiveness, remove outdated agents, and update agent definitions.',
  'universal-cross-project': 'Analyze patterns across all projects, identify shared opportunities, synchronize common agent improvements.',
  'universal-run-all-sod': 'Launch SOD (Start of Day) agents across all 6 projects simultaneously. Opens 6 terminal windows with morning reports.',
  'universal-run-all-eod': 'Launch EOD (End of Day) agents across all 6 projects simultaneously. Opens 6 terminal windows with evening updates.',
  'universal-run-all-dca': 'Launch DCA (Daily Cleanup Analysis) agents across all 6 projects simultaneously. Opens 6 terminal windows with cleanup analysis.',
  'universal-issue-planner': 'Analyze GitHub issues across all projects, create detailed implementation plans, and update issues with technical approach and acceptance criteria.',
  'universal-issue-executor': 'Execute complete development cycle for GitHub issues: analyze → plan → implement → test → PR → deploy → close issue with summary.',
  'universal-issue-reviewer': 'Review GitHub issues and PRs across projects, ensure code quality, run tests, approve deployments, and close issues.',
  'aibl-sod': 'Generate start of day report for AIBL project: system health, business metrics (wedding goals), development priorities, daily action plan.',
  'aibl-eod': 'Generate end of day update for AIBL project: progress summary, blockers encountered, tomorrow priorities, issue updates.',
  'aibl-dca': 'Generate daily cleanup analysis for AIBL project: error cleanup, dependency monitoring, code quality assessment, maintenance tasks.',
  'aibl-pr': 'Execute complete PR and deployment pipeline: branch review → PR creation → CodeRabbit monitoring → deployment → verification.',
  'aibl-sync': 'Review data sync health for AIBL: diagnose Bubble.io → Redis sync issues, plan fixes (plan mode only).',
  'aibl-langgraph': 'Maintain AI chat functionality for AIBL: LangGraph integration, chat interface, conversation flow.',
  'aibl-monitoring': 'Monitor system health for AIBL: API endpoints, performance metrics, error tracking.',
  'aibl-shadcn': 'Provide UI component expertise for AIBL: shadcn/ui implementation, component best practices.',
  'aibl-ticket-plan': 'Plan project implementation for AIBL: ticket analysis, planning phase, requirements gathering.',
  'aibl-ticket-dev': 'Guide development phase for AIBL: implementation guidance, code review, testing.',
  'bl2-sod': 'Generate start of day report for BL2 project: GitHub issues assigned, project status, team priorities, daily work plan.',
  'bl2-eod': 'Generate end of day update for BL2 project: progress summary, issue updates, tomorrow priorities.',
  'bl2-dca': 'Generate daily cleanup analysis for BL2 project: maintenance tasks, system health, optimization opportunities.',
  'bl2-github': 'Track and manage GitHub issues for BL2 project: Project #4 status, issue assignments, progress updates.',
  'blxero-sod': 'Generate start of day report for Blxero project: automated sync engine status, currency audit results, dashboard widget health.',
  'blxero-eod': 'Generate end of day update for Blxero project: sync performance, financial accuracy, system status.',
  'blxero-dca': 'Generate daily cleanup analysis for Blxero project: system maintenance, data validation, performance optimization.',
  'blxero-sync': 'Review automated sync engine status for Blxero: data synchronization, performance metrics, error analysis.',
  'blxero-currency': 'Run currency audit system analysis for Blxero: financial data validation, exchange rate updates, discrepancy detection.',
  'purezone-sod': 'Generate start of day report for PureZone project: Shopify store performance, theme health, e-commerce metrics.',
  'purezone-eod': 'Generate end of day update for PureZone project: performance summary, optimization progress, client feedback.',
  'purezone-theme': 'Analyze Shopify theme optimization for PureZone: performance analysis, code quality, user experience.',
  'upify-sod': 'Generate start of day report for Upify project: platform health, client activity, agent performance, business metrics.',
  'upify-speed': 'Run PageSpeed analysis for Upify clients: mobile/desktop reports, performance optimization recommendations.',
  'upify-seo': 'Run SEO optimization analysis for Upify: meta tags, content optimization, search engine performance.',
  'upify-conversion': 'Run conversion rate optimization for Upify: CTA analysis, checkout optimization, user experience improvements.',
  'mydiff-sod': 'Generate start of day report for MyDiff project: Shopify theme performance, store health, optimization priorities.',
  'mydiff-theme': 'Analyze MyDiff theme optimization: performance analysis, code quality, e-commerce functionality.'
}

const mockAgents: Agent[] = [
  // Universal Agents
  { id: 'universal-sod-reviewer', name: 'SOD Agent Reviewer', project: 'Universal', type: 'workflow', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-agent-updater', name: 'Agent Updater', project: 'Universal', type: 'workflow', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-cross-project', name: 'Cross-Project Sync', project: 'Universal', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-run-all-sod', name: 'Run All SOD', project: 'Universal', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-run-all-eod', name: 'Run All EOD', project: 'Universal', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-run-all-dca', name: 'Run All DCA', project: 'Universal', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-issue-planner', name: 'Issue Planner', project: 'Universal', type: 'workflow', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-issue-executor', name: 'Issue Executor', project: 'Universal', type: 'workflow', status: 'idle', path: 'C:\\Users\\User\\apps' },
  { id: 'universal-issue-reviewer', name: 'Issue Reviewer', project: 'Universal', type: 'workflow', status: 'idle', path: 'C:\\Users\\User\\apps' },
  
  // AIBL
  { id: 'aibl-sod', name: 'SOD', project: 'AIBL', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-eod', name: 'EOD', project: 'AIBL', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-dca', name: 'DCA', project: 'AIBL', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-pr', name: 'PR & Deploy', project: 'AIBL', type: 'workflow', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-sync', name: 'Data Sync Review', project: 'AIBL', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-langgraph', name: 'LangGraph Integration', project: 'AIBL', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-monitoring', name: 'Monitoring', project: 'AIBL', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-shadcn', name: 'Shadcn Expert', project: 'AIBL', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-ticket-plan', name: 'Ticket Planning', project: 'AIBL', type: 'ticket', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  { id: 'aibl-ticket-dev', name: 'Ticket Development', project: 'AIBL', type: 'ticket', status: 'idle', path: 'C:\\Users\\User\\apps\\aibl' },
  
  // BL2
  { id: 'bl2-sod', name: 'SOD', project: 'BL2', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\bl2' },
  { id: 'bl2-eod', name: 'EOD', project: 'BL2', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\bl2' },
  { id: 'bl2-dca', name: 'DCA', project: 'BL2', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\bl2' },
  { id: 'bl2-github', name: 'GitHub Issues', project: 'BL2', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\bl2' },
  
  // Blxero
  { id: 'blxero-sod', name: 'SOD', project: 'Blxero', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\blxero' },
  { id: 'blxero-eod', name: 'EOD', project: 'Blxero', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\blxero' },
  { id: 'blxero-dca', name: 'DCA', project: 'Blxero', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\blxero' },
  { id: 'blxero-sync', name: 'Automated Sync', project: 'Blxero', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\blxero' },
  { id: 'blxero-currency', name: 'Currency Audit', project: 'Blxero', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\blxero' },
  
  // PureZone
  { id: 'purezone-sod', name: 'SOD', project: 'PureZone', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\Shopify\\purezone' },
  { id: 'purezone-eod', name: 'EOD', project: 'PureZone', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\Shopify\\purezone' },
  { id: 'purezone-theme', name: 'Theme Analyzer', project: 'PureZone', type: 'core', status: 'idle', path: 'C:\\Users\\User\\Shopify\\purezone' },
  
  // Upify
  { id: 'upify-sod', name: 'SOD', project: 'Upify', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\apps\\upify' },
  { id: 'upify-speed', name: 'Speed Test', project: 'Upify', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\upify' },
  { id: 'upify-seo', name: 'SEO Optimizer', project: 'Upify', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\upify' },
  { id: 'upify-conversion', name: 'Conversion Optimizer', project: 'Upify', type: 'core', status: 'idle', path: 'C:\\Users\\User\\apps\\upify' },
  
  // MyDiff
  { id: 'mydiff-sod', name: 'SOD', project: 'MyDiff', type: 'daily', status: 'idle', path: 'C:\\Users\\User\\Shopify\\mydiff' },
  { id: 'mydiff-theme', name: 'Theme Analyzer', project: 'MyDiff', type: 'core', status: 'idle', path: 'C:\\Users\\User\\Shopify\\mydiff' }
]

const getStatusDot = (status: Agent['status']) => {
  switch (status) {
    case 'running': return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
    case 'completed': return <div className="w-2 h-2 bg-green-500 rounded-full" />
    case 'failed': return <div className="w-2 h-2 bg-red-500 rounded-full" />
    default: return <div className="w-2 h-2 bg-gray-300 rounded-full" />
  }
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set())
  const [runningTerminals, setRunningTerminals] = useState<RunningTerminal[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [gitInfo, setGitInfo] = useState<GitInfo[]>([])
  const [activeTab, setActiveTab] = useState<'agents' | 'issues'>('agents')
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null)
  const [issuesLoading, setIssuesLoading] = useState(false)

  // Load git information on component mount
  useEffect(() => {
    const loadGitInfo = async () => {
      try {
        const response = await fetch('/api/get-git-info')
        if (response.ok) {
          const data = await response.json()
          setGitInfo(data.projects || [])
        }
      } catch (error) {
        console.error('Failed to load git info:', error)
      }
    }
    
    loadGitInfo()
  }, [])

  // Load GitHub issues
  const loadIssues = async (project?: string) => {
    setIssuesLoading(true)
    try {
      const url = project ? `/api/github-issues?project=${project}` : '/api/github-issues'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setIssues(data.issues || [])
      }
    } catch (error) {
      console.error('Failed to load GitHub issues:', error)
    } finally {
      setIssuesLoading(false)
    }
  }

  // Load issues when switching to issues tab
  useEffect(() => {
    if (activeTab === 'issues') {
      loadIssues()
    }
  }, [activeTab])

  const showPrompt = (agent: Agent) => {
    setSelectedAgent(agent)
  }

  const closeModal = () => {
    setSelectedAgent(null)
  }

  // Check for running terminals every 5 seconds
  useEffect(() => {
    const checkRunningTerminals = async () => {
      try {
        const response = await fetch('/api/check-running-agents')
        if (response.ok) {
          const data = await response.json()
          const terminals = data.runningAgents || []
          setRunningTerminals(terminals)
          
          console.log('Running terminals detected:', terminals)
          
          // Update agent statuses based on detected terminals
          setAgents(prev => prev.map(agent => {
            const matchingTerminal = terminals.find((terminal: any) => {
              // Match by agent name and project
              const agentMatches = terminal.agentName === agent.name || 
                                 (agent.name === 'SOD' && terminal.agentName === 'SOD Agent') ||
                                 (agent.name === 'EOD' && terminal.agentName === 'EOD Agent') ||
                                 (agent.name === 'DCA' && terminal.agentName === 'DCA Agent')
              
              const projectMatches = terminal.projectName === agent.project
              
              return agentMatches && projectMatches
            })
            
            return matchingTerminal 
              ? { ...agent, status: 'running' as const }
              : agent.status === 'running' 
                ? { ...agent, status: 'completed' as const, lastRun: new Date() }
                : agent
          }))
        }
      } catch (error) {
        console.error('Failed to check running terminals:', error)
      }
    }

    // Start checking immediately
    checkRunningTerminals()
    const interval = setInterval(checkRunningTerminals, 5000)
    return () => clearInterval(interval)
  }, [])

  const runAgent = async (agent: Agent) => {
    setRunningAgents(prev => new Set(prev).add(agent.id))
    setAgents(prev => prev.map(a => 
      a.id === agent.id ? { ...a, status: 'running' } : a
    ))

    try {
      // Use enhanced API with better tracking  
      console.log('Running agent:', agent.name, 'in project:', agent.project)
      const response = await fetch('/api/enhanced-run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          projectPath: agent.path.replace(/\\/g, '/'), // Fix Windows path escaping
          agentName: agent.name,
          projectName: agent.project
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Agent launched with enhanced tracking:', data)
        
        // Keep agent in running state - status will update from real-time checks
        setRunningAgents(prev => {
          const newSet = new Set(prev)
          newSet.delete(agent.id)
          return newSet
        })
      } else {
        setAgents(prev => prev.map(a => 
          a.id === agent.id ? { ...a, status: 'failed' } : a
        ))
        setRunningAgents(prev => {
          const newSet = new Set(prev)
          newSet.delete(agent.id)
          return newSet
        })
      }
    } catch (error) {
      setAgents(prev => prev.map(a => 
        a.id === agent.id ? { ...a, status: 'failed' } : a
      ))
      setRunningAgents(prev => {
        const newSet = new Set(prev)
        newSet.delete(agent.id)
        return newSet
      })
    }
  }

  const projects = ['Universal', 'AIBL', 'BL2', 'Blxero', 'PureZone', 'Upify', 'MyDiff']

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Compact Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            {agents.filter(a => a.status === 'completed').length}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {runningAgents.size}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            {agents.filter(a => a.status === 'idle').length}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 flex gap-1 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'agents'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Agents
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'issues'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Universal Issues {issues.length > 0 && `(${issues.length})`}
        </button>
      </div>

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-7 gap-4">
        {projects.map(projectName => {
          const projectAgents = agents.filter(a => a.project === projectName)
          const projectGit = gitInfo.find(g => g.project === projectName)
          
          return (
            <div key={projectName} className="bg-slate-50 rounded-lg p-3">
              {/* Header with project name */}
              <div className="mb-2">
                <h3 className="font-medium text-slate-900 text-left mb-1">{projectName}</h3>
                
                {/* GitHub repo and branch info */}
                {projectGit && projectGit.hasGit && (
                  <div className="flex flex-col gap-1">
                    {/* GitHub repo link */}
                    {projectGit.githubUrl && (
                      <a 
                        href={projectGit.githubUrl.split('/tree/')[0]} // Remove branch part for main repo link
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        <GitBranch className="w-3 h-3" />
                        {projectGit.githubUrl.split('/tree/')[0].replace('https://github.com/', '')}
                      </a>
                    )}
                    
                    {/* Current branch */}
                    {projectGit.branch && (
                      <div className="text-xs text-slate-500">
                        Branch: {projectGit.branch}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Launch Claude button for each project */}
              <button
                onClick={async () => {
                  const projectPaths: Record<string, string> = {
                    'Universal': 'C:\\Users\\User\\apps',
                    'AIBL': 'C:\\Users\\User\\apps\\aibl',
                    'BL2': 'C:\\Users\\User\\apps\\bl2',
                    'Blxero': 'C:\\Users\\User\\apps\\blxero',
                    'PureZone': 'C:\\Users\\User\\Shopify\\purezone',
                    'Upify': 'C:\\Users\\User\\apps\\upify',
                    'MyDiff': 'C:\\Users\\User\\Shopify\\mydiff'
                  }
                  
                  const path = projectPaths[projectName]
                  if (path) {
                    await fetch('/api/run-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        agentId: `${projectName.toLowerCase()}-launch`,
                        projectPath: path,
                        agentName: `Launch Claude in ${projectName}`
                      })
                    })
                  }
                }}
                className="w-full mb-2 px-2 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-700 transition-colors"
              >
                Launch Claude
              </button>
              
              <div className="space-y-2">
                {projectAgents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 bg-white rounded p-2 text-sm">
                    <div className="flex items-center gap-1 flex-1">
                      {getStatusDot(agent.status)}
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    
                    {agent.lastRun && (
                      <span className="text-xs text-slate-500">{formatTime(agent.lastRun)}</span>
                    )}
                    
                    <div className="flex gap-1">
                      {/* Eye icon to view prompt */}
                      <button
                        onClick={() => showPrompt(agent)}
                        className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        title="View agent prompt"
                      >
                        <Eye className="w-3 h-3" />
                      </button>

                      {/* Show terminal link if agent is running */}
                      {agent.status === 'running' && (() => {
                        const terminal = runningTerminals.find(t => 
                          t.agentName.includes(agent.name) && t.projectPath.includes(agent.project.toLowerCase())
                        )
                        return terminal ? (
                          <button
                            onClick={async () => {
                              await fetch('/api/focus-terminal', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  windowTitle: terminal.agentName,
                                  processId: terminal.processId
                                })
                              })
                            }}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            title="Focus terminal window"
                          >
                            <Terminal className="w-3 h-3" />
                          </button>
                        ) : null
                      })()}
                      
                      <button
                        onClick={() => runAgent(agent)}
                        disabled={runningAgents.has(agent.id) || agent.status === 'running'}
                        className={`p-1 rounded transition-colors ${
                          runningAgents.has(agent.id) || agent.status === 'running'
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {runningAgents.has(agent.id) || agent.status === 'running' ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {/* Issues Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-slate-900">Universal Issues</h2>
              {issuesLoading && <div className="w-4 h-4 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />}
            </div>
            <button
              onClick={() => loadIssues()}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* TanStack Table */}
          {issues.length > 0 ? (
            <IssuesTable
              issues={issues}
              onAssignAgent={(issueWithAgent: any) => {
                // Run the selected agent with the issue context
                const agent = agents.find(a => a.id === issueWithAgent.selectedAgentId)
                if (agent) {
                  runAgent({
                    ...agent,
                    // Add issue context to the agent execution
                    issueContext: {
                      number: issueWithAgent.number,
                      title: issueWithAgent.title,
                      url: issueWithAgent.html_url,
                      project: issueWithAgent.project
                    }
                  })
                }
              }}
              onViewIssue={(issue) => setSelectedIssue(issue)}
              agents={agents}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">No issues found</div>
              <div className="text-sm text-slate-500">
                Make sure your GitHub token is configured and repositories are accessible
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prompt Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedAgent.name} - {selectedAgent.project}
              </h2>
              <button 
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Agent Prompt:</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {agentPrompts[selectedAgent.id] || 'No prompt defined for this agent.'}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  runAgent(selectedAgent)
                  closeModal()
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Run Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedIssue(null)}>
          <div className="bg-white rounded-lg p-6 max-w-3xl max-h-[80vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  #{selectedIssue.number} - {selectedIssue.project}
                </h2>
                <span className={`px-2 py-1 text-xs rounded ${
                  selectedIssue.stage === 'backlog' ? 'bg-gray-100 text-gray-700' :
                  selectedIssue.stage === 'planning' ? 'bg-yellow-100 text-yellow-700' :
                  selectedIssue.stage === 'development' ? 'bg-blue-100 text-blue-700' :
                  selectedIssue.stage === 'review' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {selectedIssue.stage}
                </span>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="text-slate-500 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium text-slate-900 text-lg mb-2">{selectedIssue.title}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{selectedIssue.user.login}</span>
                </div>
                <span>Created: {new Date(selectedIssue.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(selectedIssue.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {selectedIssue.labels.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Labels:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIssue.labels.map(label => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                    >
                      <Tag className="w-3 h-3" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">Description:</h4>
              <div className="text-sm text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedIssue.body || 'No description provided.'}
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <a
                href={selectedIssue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on GitHub
              </a>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>
                {!selectedIssue.assignedAgent && (
                  <button
                    onClick={() => {
                      // TODO: Implement agent assignment
                      alert('Agent assignment coming soon!')
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Assign to Agent
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}