'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  User, 
  Tag, 
  Clock,
  Play,
  Eye,
  MoreHorizontal,
  Filter,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
  
  // Manager Analytics
  agentEstimate?: {
    estimatedHours: number
    complexity: string
    confidence: number
  } | null
  commitReality?: {
    hasStarted: boolean
    daysWorked: number
    commitCount: number
    velocity: number
    pattern: string
  } | null
  managerStatus?: string
  completionPrediction?: {
    predictedDate: string
    confidence: number
    method: string
  } | null
  coachingInsights?: string[]
  managerFlags?: string[]
  commitCount?: number
  lastCommitDate?: string | null
}

interface IssuesTableProps {
  issues: GitHubIssue[]
  onAssignAgent: (issue: GitHubIssue) => void
  onViewIssue: (issue: GitHubIssue) => void
  agents: Array<{ id: string; name: string }>
}

const columnHelper = createColumnHelper<GitHubIssue>()

const getPriorityFromLabels = (labels: string[]): 'high' | 'medium' | 'low' => {
  if (labels.some(l => l.toLowerCase().includes('urgent') || l.toLowerCase().includes('high'))) return 'high'
  if (labels.some(l => l.toLowerCase().includes('medium') || l.toLowerCase().includes('priority'))) return 'medium'
  return 'low'
}

const getStageColor = (stage: string): string => {
  switch (stage) {
    case 'backlog': return 'bg-gray-100 text-gray-700'
    case 'planning': return 'bg-yellow-100 text-yellow-700'  
    case 'development': return 'bg-blue-100 text-blue-700'
    case 'review': return 'bg-purple-100 text-purple-700'
    case 'deploy': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function IssuesTable({ issues, onAssignAgent, onViewIssue, agents }: IssuesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updated_at', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)

  // Get agents for a specific project
  const getAgentsForProject = (project: string) => {
    return agents.filter(agent => 
      agent.id.startsWith(project.toLowerCase()) || 
      agent.id.startsWith('universal')
    )
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.agent-dropdown')) {
        setOpenDropdown(null)
      }
    }

    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  const columns = useMemo<ColumnDef<GitHubIssue>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'project',
        header: 'Project',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-sm">{row.getValue('project')}</span>
          </div>
        ),
        filterFn: 'equals',
      },
      {
        accessorKey: 'title',
        header: 'Issue',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">#{row.original.number}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(row.original.stage)}`}>
                {row.original.stage}
              </span>
            </div>
            <div className="font-medium text-sm text-gray-900 line-clamp-2">
              {row.getValue('title')}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <img 
                src={row.original.user.avatar_url} 
                alt={row.original.user.login}
                className="w-4 h-4 rounded-full"
              />
              <span className="text-xs text-gray-500">{row.original.user.login}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'labels',
        header: 'Labels',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-32">
            {row.original.labels.slice(0, 3).map((label) => (
              <span 
                key={label}
                className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                <Tag className="w-2 h-2" />
                {label}
              </span>
            ))}
            {row.original.labels.length > 3 && (
              <span className="text-xs text-gray-400">+{row.original.labels.length - 3}</span>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'assignee',
        header: 'Assignee',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.assignee ? (
              <>
                <img 
                  src={`https://github.com/${row.original.assignee}.png`} 
                  alt={row.original.assignee}
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-xs text-gray-500">{row.original.assignee}</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Unassigned</span>
            )}
          </div>
        ),
      },
      {
        id: 'runAgent',
        header: 'Run Agent',
        cell: ({ row }) => {
          const projectAgents = getAgentsForProject(row.original.project)
          const isDropdownOpen = openDropdown === row.original.id
          
          return (
            <div className="relative agent-dropdown">
              <button
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => setOpenDropdown(isDropdownOpen ? null : row.original.id)}
              >
                <Play className="w-3 h-3" />
                Run Agent ({projectAgents.length})
                <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {projectAgents.length > 0 ? (
                      projectAgents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            onAssignAgent({ ...row.original, selectedAgentId: agent.id })
                            setOpenDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <Settings className="w-3 h-3 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{agent.name}</div>
                            <div className="text-gray-500">{agent.id.startsWith('universal') ? 'Universal' : row.original.project}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No agents available for this project
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(row.getValue('updated_at')), { addSuffix: true })}
          </div>
        ),
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'agentEstimate',
        header: 'Agent Estimate',
        cell: ({ row }) => {
          const estimate = row.original.agentEstimate
          if (!estimate) return <span className="text-xs text-gray-400">-</span>
          
          return (
            <div className="text-xs">
              <div className="font-medium">{estimate.estimatedHours}h</div>
              <div className="text-gray-500">{estimate.complexity}</div>
              <div className="text-gray-400">{Math.round(estimate.confidence * 100)}% confident</div>
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const estA = rowA.original.agentEstimate?.estimatedHours || 0
          const estB = rowB.original.agentEstimate?.estimatedHours || 0
          return estA - estB
        },
      },
      {
        accessorKey: 'commitReality',
        header: 'Reality Check',
        cell: ({ row }) => {
          const reality = row.original.commitReality
          const commits = row.original.commitCount || 0
          
          if (!reality?.hasStarted) {
            return <div className="text-xs text-gray-400">Not started</div>
          }
          
          const statusColors = {
            'steady': 'text-green-600',
            'high-velocity': 'text-blue-600', 
            'slow-progress': 'text-yellow-600',
            'stale': 'text-red-600'
          }
          
          return (
            <div className="text-xs">
              <div className="font-medium">{reality.daysWorked} days</div>
              <div className="text-gray-600">{commits} commits</div>
              <div className={`${statusColors[reality.pattern as keyof typeof statusColors] || 'text-gray-500'}`}>
                {reality.pattern}
              </div>
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const daysA = rowA.original.commitReality?.daysWorked || 0
          const daysB = rowB.original.commitReality?.daysWorked || 0
          return daysA - daysB
        },
      },
      {
        accessorKey: 'managerStatus',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.managerStatus
          const flags = row.original.managerFlags || []
          
          const statusConfig = {
            'on-track': { color: 'bg-green-100 text-green-700', icon: '✅' },
            'at-risk': { color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' },
            'overdue': { color: 'bg-red-100 text-red-700', icon: '🚨' },
            'not-started': { color: 'bg-gray-100 text-gray-700', icon: '⏸️' },
            'unknown': { color: 'bg-gray-100 text-gray-500', icon: '❓' }
          }
          
          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown
          
          return (
            <div className="text-xs">
              <span className={`px-2 py-1 rounded font-medium flex items-center gap-1 ${config.color}`}>
                <span>{config.icon}</span>
                {status}
              </span>
              {flags.length > 0 && (
                <div className="mt-1 text-red-600" title={flags.join(', ')}>
                  🚩 {flags.length} alert{flags.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const statusOrder = { 'overdue': 4, 'at-risk': 3, 'not-started': 2, 'on-track': 1, 'unknown': 0 }
          const statusA = statusOrder[rowA.original.managerStatus as keyof typeof statusOrder] || 0
          const statusB = statusOrder[rowB.original.managerStatus as keyof typeof statusOrder] || 0
          return statusB - statusA // Highest priority first
        },
      },
      {
        accessorKey: 'completionPrediction',
        header: 'Predicted Completion',
        cell: ({ row }) => {
          const prediction = row.original.completionPrediction
          if (!prediction) return <span className="text-xs text-gray-400">-</span>
          
          const date = new Date(prediction.predictedDate)
          const isOverdue = date < new Date()
          const daysFromNow = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          
          return (
            <div className="text-xs">
              <div className={`font-medium ${isOverdue ? 'text-red-600' : daysFromNow <= 3 ? 'text-yellow-600' : 'text-gray-900'}`}>
                {daysFromNow <= 0 ? 'Overdue' : 
                 daysFromNow === 1 ? 'Tomorrow' :
                 daysFromNow <= 7 ? `${daysFromNow} days` :
                 date.toLocaleDateString()}
              </div>
              <div className="text-gray-500">{Math.round(prediction.confidence * 100)}% confidence</div>
              <div className="text-gray-400">{prediction.method}</div>
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.completionPrediction?.predictedDate ? new Date(rowA.original.completionPrediction.predictedDate).getTime() : Infinity
          const dateB = rowB.original.completionPrediction?.predictedDate ? new Date(rowB.original.completionPrediction.predictedDate).getTime() : Infinity
          return dateA - dateB
        },
      },
      {
        accessorKey: 'lastCommitDate',
        header: 'Last Activity',
        cell: ({ row }) => {
          const lastCommit = row.original.lastCommitDate
          const commitCount = row.original.commitCount || 0
          
          if (!lastCommit) {
            return <div className="text-xs text-gray-400">No commits</div>
          }
          
          const date = new Date(lastCommit)
          const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
          
          const activityColor = daysAgo === 0 ? 'text-green-600' :
                               daysAgo <= 3 ? 'text-blue-600' :
                               daysAgo <= 7 ? 'text-yellow-600' : 'text-red-600'
          
          return (
            <div className="text-xs">
              <div className={`font-medium ${activityColor}`}>
                {daysAgo === 0 ? 'Today' :
                 daysAgo === 1 ? 'Yesterday' :
                 `${daysAgo} days ago`}
              </div>
              <div className="text-gray-600">{commitCount} total commits</div>
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.lastCommitDate ? new Date(rowA.original.lastCommitDate).getTime() : 0
          const dateB = rowB.original.lastCommitDate ? new Date(rowB.original.lastCommitDate).getTime() : 0
          return dateB - dateA // Most recent first
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewIssue(row.original)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <a
              href={row.original.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Open in GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="More Actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onAssignAgent, onViewIssue]
  )

  const table = useReactTable({
    data: issues,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 100, // Show more issues by default for manager view
      },
    },
  })

  const projects = useMemo(() => 
    Array.from(new Set(issues.map(i => i.project))).sort(), 
    [issues]
  )
  
  const stages = useMemo(() => 
    Array.from(new Set(issues.map(i => i.stage))).sort(), 
    [issues]
  )

  const selectedRows = table.getFilteredSelectedRowModel().rows

  return (
    <div className="space-y-4">
      {/* Filters and Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value)
              if (e.target.value === 'all') {
                table.getColumn('project')?.setFilterValue(undefined)
              } else {
                table.getColumn('project')?.setFilterValue(e.target.value)
              }
            }}
            className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          
          <select
            value={stageFilter} 
            onChange={(e) => {
              setStageFilter(e.target.value)
              if (e.target.value === 'all') {
                table.getColumn('stage')?.setFilterValue(undefined)
              } else {
                table.getColumn('stage')?.setFilterValue(e.target.value)  
              }
            }}
            className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
          >
            <option value="all">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedRows.length} selected
            </span>
            <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
              Bulk Assign Agent
            </button>
          </div>
        )}

        <div className="text-sm text-gray-500">
          {table.getFilteredRowModel().rows.length} of {issues.length} issues
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-900' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="flex flex-col">
                              <ChevronUp
                                className={`w-3 h-3 ${
                                  header.column.getIsSorted() === 'asc' ? 'text-gray-900' : 'text-gray-400'
                                }`}
                              />
                              <ChevronDown
                                className={`w-3 h-3 -mt-1 ${
                                  header.column.getIsSorted() === 'desc' ? 'text-gray-900' : 'text-gray-400'
                                }`}
                              />
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${row.getIsSelected() ? 'bg-blue-50' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'<'}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'>>'}
          </button>
        </div>

        <span className="flex items-center gap-1 text-sm text-gray-700">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>

        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
        >
          {[50, 100, 200, 300, 500].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}