import { Clock, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Project } from '@/data/db'
import { StatusBadge } from './StatusBadge'
import { CurrencyAmount } from './CurrencyAmount'

function AiScore({ score }: { score: number }) {
  const color = score >= 85 ? 'text-green-600' : score >= 65 ? 'text-amber-600' : 'text-red-600'
  const Icon = score >= 85 ? TrendingUp : score >= 65 ? Minus : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 font-semibold font-mono text-sm ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {score}%
    </span>
  )
}

interface ProjectTableProps {
  projects: Project[]
  linkBase?: string
  showCreatedBy?: boolean
}

export function ProjectTable({ projects, linkBase = '/respondent/projects', showCreatedBy = false }: ProjectTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] dark:border-white/10">
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide w-20">AI Score</th>
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide">Project Name</th>
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Strategic Priority</th>
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Classification</th>
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide">Budget</th>
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide">Status</th>
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Pending With</th>
            {showCreatedBy && <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide hidden xl:table-cell">Created By</th>}
            <th className="whitespace-nowrap text-start py-3 px-4 text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className="border-b border-[#F1F5F9] dark:border-white/5 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-4">
                <AiScore score={project.aiScore} />
              </td>
              <td className="py-3 px-4">
                <Link
                  to={`${linkBase}/${project.id}`}
                  className="font-medium text-[#0F172A] dark:text-white hover:text-[var(--primary)] transition-colors flex items-center gap-1.5"
                >
                  {project.clarifications.some((c) => c.status === 'Pending') && (
                    <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  {project.name}
                </Link>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-[#475569] dark:text-slate-400 text-xs">{project.strategicPriority}</span>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-[#475569] dark:text-slate-400 text-xs">{project.classification}</span>
              </td>
              <td className="py-3 px-4">
                <CurrencyAmount amount={project.requestedBudget} className="font-semibold text-[#0F172A] dark:text-white text-xs" />
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={project.status} />
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                {project.pendingWith ? (
                  <span className="text-[var(--primary)] text-xs font-medium">{project.pendingWith}</span>
                ) : (
                  <span className="text-[#94A3B8] text-xs">-</span>
                )}
              </td>
              {showCreatedBy && (
                <td className="py-3 px-4 hidden xl:table-cell">
                  <span className="text-[#475569] dark:text-slate-400 text-xs">{project.submittedBy}</span>
                </td>
              )}
              <td className="py-3 px-4">
                <Link
                  to={`${linkBase}/${project.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
