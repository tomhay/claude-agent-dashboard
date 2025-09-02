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
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const priority = getPriorityFromLabels(row.original.labels)
          const colors = {
            high: 'bg-red-100 text-red-700',
            medium: 'bg-yellow-100 text-yellow-700',
            low: 'bg-green-100 text-green-700'
          }
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority]}`}>
              {priority}
            </span>
          )
        },
        sortingFn: (rowA, rowB) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const priorityA = getPriorityFromLabels(rowA.original.labels)
          const priorityB = getPriorityFromLabels(rowB.original.labels)
          return priorityOrder[priorityA] - priorityOrder[priorityB]
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
        pageSize: 20,
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
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}