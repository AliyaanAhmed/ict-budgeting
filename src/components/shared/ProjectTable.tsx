import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDownAZ, ArrowUpAZ, Check, Clock, Eye, Filter, Minus, TrendingDown, TrendingUp, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Project } from '@/data/db'
import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { CurrencyAmount } from './CurrencyAmount'
import { UserHoverCard } from './UserHoverCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ColumnType = 'text' | 'number' | 'option'
type TextOperator = 'contains' | 'equals'
type NumberOperator = 'equals' | 'greaterThan' | 'lessThan'
type SortDirection = 'asc' | 'desc'

interface ColumnFilter {
  operator?: TextOperator | NumberOperator
  value?: string
  option?: string
}

interface SortState {
  columnId: string
  direction: SortDirection
}

interface ColumnDefinition<T> {
  id: string
  header: string
  type: ColumnType
  accessor: (row: T) => string | number | null | undefined
  render?: (row: T) => ReactNode
  options?: string[]
  className?: string
  headerClassName?: string
  filterable?: boolean
}

function AiScore({ score }: { score: number }) {
  const color = score >= 85 ? 'text-green-600' : score >= 65 ? 'text-amber-600' : 'text-red-600'
  const Icon = score >= 85 ? TrendingUp : score >= 65 ? Minus : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {score}%
    </span>
  )
}

function normalize(value: string | number | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

function compareValues(a: string | number | null | undefined, b: string | number | null | undefined, type: ColumnType) {
  if (type === 'number') {
    return Number(a ?? 0) - Number(b ?? 0)
  }

  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base', numeric: true })
}

function matchesFilter<T>(row: T, column: ColumnDefinition<T>, filter: ColumnFilter) {
  const rawValue = column.accessor(row)

  if (column.type === 'option') {
    return !filter.option || String(rawValue ?? '') === filter.option
  }

  if (!filter.value?.trim()) return true

  if (column.type === 'number') {
    const rowValue = Number(rawValue ?? 0)
    const filterValue = Number(filter.value)
    if (Number.isNaN(filterValue)) return true
    if (filter.operator === 'greaterThan') return rowValue > filterValue
    if (filter.operator === 'lessThan') return rowValue < filterValue
    return rowValue === filterValue
  }

  const rowValue = normalize(rawValue)
  const filterValue = normalize(filter.value)
  if (filter.operator === 'equals') return rowValue === filterValue
  return rowValue.includes(filterValue)
}

function ColumnFilterMenu<T>({
  column,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onClear,
}: {
  column: ColumnDefinition<T>
  filter?: ColumnFilter
  sort?: SortState
  onFilterChange: (filter: ColumnFilter) => void
  onSortChange: (direction: SortDirection) => void
  onClear: () => void
}) {
  const isActive = Boolean(filter?.value || filter?.option || sort?.columnId === column.id)
  const selectedSort = sort?.columnId === column.id ? sort.direction : undefined
  const currentFilter = filter ?? {}
  const textOperator = (currentFilter.operator as TextOperator | undefined) ?? 'contains'
  const numberOperator = (currentFilter.operator as NumberOperator | undefined) ?? 'equals'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors',
            isActive
              ? 'border-[#286CFF] bg-[#E7F5FF] text-[#286CFF]'
              : 'border-transparent text-[#94A3B8] hover:border-[#B0DBFF] hover:bg-[#E7F5FF] hover:text-[#286CFF]'
          )}
          aria-label={`Filter ${column.header}`}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <DropdownMenuLabel className="p-0 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
              {column.header}
            </DropdownMenuLabel>
            <p className="mt-1 text-xs text-[#94A3B8]">Column filter</p>
          </div>
          {isActive && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              aria-label={`Clear ${column.header} filter`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSortChange('asc')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors',
              selectedSort === 'asc'
                ? 'border-[#286CFF] bg-[#E7F5FF] text-[#286CFF]'
                : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
            )}
          >
            <ArrowUpAZ className="h-3.5 w-3.5" />
            Asc
          </button>
          <button
            type="button"
            onClick={() => onSortChange('desc')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors',
              selectedSort === 'desc'
                ? 'border-[#286CFF] bg-[#E7F5FF] text-[#286CFF]'
                : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
            )}
          >
            <ArrowDownAZ className="h-3.5 w-3.5" />
            Desc
          </button>
        </div>

        {column.type !== 'option' && (
          <>
            <DropdownMenuSeparator className="my-3" />
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {column.type === 'text' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onFilterChange({ ...currentFilter, operator: 'contains' })}
                      className={cn(
                        'rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors',
                        textOperator === 'contains'
                          ? 'border-[#286CFF] bg-[#E7F5FF] text-[#286CFF]'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                      )}
                    >
                      Contains
                    </button>
                    <button
                      type="button"
                      onClick={() => onFilterChange({ ...currentFilter, operator: 'equals' })}
                      className={cn(
                        'rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors',
                        textOperator === 'equals'
                          ? 'border-[#286CFF] bg-[#E7F5FF] text-[#286CFF]'
                          : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                      )}
                    >
                      Equals
                    </button>
                  </>
                ) : (
                  <>
                    {[
                      ['equals', 'Equals'],
                      ['greaterThan', 'Greater'],
                      ['lessThan', 'Less'],
                    ].map(([operator, label]) => (
                      <button
                        key={operator}
                        type="button"
                        onClick={() => onFilterChange({ ...currentFilter, operator: operator as NumberOperator })}
                        className={cn(
                          'rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors',
                          numberOperator === operator
                            ? 'border-[#286CFF] bg-[#E7F5FF] text-[#286CFF]'
                            : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]',
                          operator === 'lessThan' && 'col-span-2'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </>
                )}
              </div>
              <Input
                value={currentFilter.value ?? ''}
                onChange={(event) => onFilterChange({ ...currentFilter, value: event.target.value })}
                placeholder={column.type === 'number' ? 'Enter value' : `Filter ${column.header}`}
                className="h-9 text-sm"
              />
            </div>
          </>
        )}

        {column.type === 'option' && (
          <>
            <DropdownMenuSeparator className="my-3" />
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {(column.options ?? []).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onFilterChange({ option })}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    currentFilter.option === option
                      ? 'bg-[#E7F5FF] font-semibold text-[#286CFF]'
                      : 'text-[#475569] hover:bg-[#F8FAFC]'
                  )}
                >
                  <span className="truncate">{option}</span>
                  {currentFilter.option === option && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ProjectTableProps {
  projects: Project[]
  linkBase?: string
  showCreatedBy?: boolean
}

export function ProjectTable({ projects, linkBase = '/respondent/projects', showCreatedBy = false }: ProjectTableProps) {
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({})
  const [sort, setSort] = useState<SortState | undefined>()

  const columns = useMemo<ColumnDefinition<Project>[]>(() => {
    const baseColumns: ColumnDefinition<Project>[] = [
      {
        id: 'aiScore',
        header: 'AI Score',
        type: 'number',
        accessor: (project) => project.aiScore,
        render: (project) => <AiScore score={project.aiScore} />,
        headerClassName: 'w-28',
      },
      {
        id: 'name',
        header: 'Project Name',
        type: 'text',
        accessor: (project) => project.name,
        render: (project) => (
          <Link
            to={`${linkBase}/${project.id}`}
            className="flex items-center gap-1.5 font-medium text-[#0F172A] transition-colors hover:text-[var(--primary)] dark:text-white"
          >
            {project.clarifications.some((c) => c.status === 'Open') && (
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
            {project.name}
          </Link>
        ),
      },
      {
        id: 'strategicPriority',
        header: 'Strategic Priority',
        type: 'option',
        accessor: (project) => project.strategicPriority,
        options: Array.from(new Set(projects.map((project) => project.strategicPriority))).sort(),
        className: 'hidden md:table-cell',
        headerClassName: 'hidden md:table-cell',
      },
      {
        id: 'classification',
        header: 'Classification',
        type: 'option',
        accessor: (project) => project.classification,
        options: Array.from(new Set(projects.map((project) => project.classification))).sort(),
        className: 'hidden lg:table-cell',
        headerClassName: 'hidden lg:table-cell',
      },
      {
        id: 'budget',
        header: 'Budget',
        type: 'number',
        accessor: (project) => project.requestedBudget,
        render: (project) => (
          <CurrencyAmount amount={project.requestedBudget} className="text-xs font-semibold text-[#0F172A] dark:text-white" />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        type: 'option',
        accessor: (project) => project.status,
        options: Array.from(new Set(projects.map((project) => project.status))).sort(),
        render: (project) => <StatusBadge status={project.status} />,
      },
      {
        id: 'pendingWith',
        header: 'Pending With',
        type: 'option',
        accessor: (project) => project.pendingWith || '-',
        options: Array.from(new Set(projects.map((project) => project.pendingWith || '-'))).sort(),
        render: (project) =>
          project.pendingWith ? (
            <UserHoverCard name={project.pendingWith} role={project.pendingWith} subtitle="Current Workflow Owner" />
          ) : (
            <span className="text-xs text-[#94A3B8]">-</span>
          ),
        className: 'hidden md:table-cell',
        headerClassName: 'hidden md:table-cell',
      },
    ]

    if (showCreatedBy) {
      baseColumns.push({
        id: 'createdBy',
        header: 'Created By',
        type: 'option',
        accessor: (project) => project.submittedBy,
        options: Array.from(new Set(projects.map((project) => project.submittedBy))).sort(),
        render: (project) => <UserHoverCard name={project.submittedBy} role="Respondent" subtitle="Project Creator" />,
        className: 'hidden xl:table-cell',
        headerClassName: 'hidden xl:table-cell',
      })
    }

    baseColumns.push({
      id: 'action',
      header: 'Action',
      type: 'text',
      accessor: () => '',
      filterable: false,
      render: (project) => (
        <Link
          to={`${linkBase}/${project.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-[#E7F5FF] px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[#D3EDFF] hover:text-[#043DFF] dark:bg-[#286CFF]/15 dark:hover:bg-[#286CFF]/25"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
      ),
    })

    return baseColumns
  }, [linkBase, projects, showCreatedBy])

  const tableRows = useMemo(() => {
    const filteredRows = projects.filter((project) =>
      columns.every((column) => column.filterable === false || matchesFilter(project, column, filters[column.id] ?? {}))
    )

    if (!sort) return filteredRows

    const sortedColumn = columns.find((column) => column.id === sort.columnId)
    if (!sortedColumn) return filteredRows

    return [...filteredRows].sort((a, b) => {
      const comparison = compareValues(sortedColumn.accessor(a), sortedColumn.accessor(b), sortedColumn.type)
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }, [columns, filters, projects, sort])

  const updateFilter = (columnId: string, filter: ColumnFilter) => {
    setFilters((current) => ({ ...current, [columnId]: filter }))
  }

  const clearColumn = (columnId: string) => {
    setFilters((current) => {
      const next = { ...current }
      delete next[columnId]
      return next
    })
    setSort((current) => (current?.columnId === columnId ? undefined : current))
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] dark:border-white/10 dark:bg-white/5">
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-start text-xs font-semibold text-[#475569] dark:text-slate-200',
                  column.headerClassName
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.filterable !== false && (
                    <ColumnFilterMenu
                      column={column}
                      filter={filters[column.id]}
                      sort={sort}
                      onFilterChange={(filter) => updateFilter(column.id, filter)}
                      onSortChange={(direction) => setSort({ columnId: column.id, direction })}
                      onClear={() => clearColumn(column.id)}
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((project) => (
            <tr
              key={project.id}
              className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC] dark:border-white/5 dark:hover:bg-white/5"
            >
              {columns.map((column) => (
                <td key={column.id} className={cn('px-4 py-3', column.className)}>
                  {column.render ? (
                    column.render(project)
                  ) : (
                    <span className="text-xs text-[#475569] dark:text-slate-200">{column.accessor(project) || '-'}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
          {tableRows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[#64748B] dark:text-slate-200">
                No projects match the selected column filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {(Object.keys(filters).length > 0 || sort) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] bg-white px-4 py-3 dark:border-white/5 dark:bg-[#1E293B]">
          <p className="text-xs font-medium text-[#64748B] dark:text-slate-200">
            Showing {tableRows.length} of {projects.length} projects
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters({})
              setSort(undefined)
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear Column Filters
          </Button>
        </div>
      )}
    </div>
  )
}
