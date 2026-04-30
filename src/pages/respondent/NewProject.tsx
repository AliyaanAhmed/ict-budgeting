import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Sparkles, Upload, Plus, X, Send, ChevronRight, Bot, CalendarDays, Layers, Briefcase, Building2, Package, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function SectionNumber({ n }: { n: number }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)] text-sm font-bold shrink-0 border border-[var(--primary-subtle)]">
      {n}
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </label>
      {children}
    </div>
  )
}

function ModernSelect({
  placeholder,
  options,
  icon: Icon,
}: {
  placeholder: string
  options: string[]
  icon: React.ElementType
}) {
  return (
    <Select>
      <SelectTrigger className="h-11 rounded-xl border-[#D7E1EC]">
        <span className="inline-flex w-full items-center gap-2 text-[#64748B] whitespace-nowrap">
          <Icon className="h-4 w-4" />
          <SelectValue className="truncate" placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((o) => (
          <SelectItem key={o} value={o.toLowerCase().replace(/\s+/g, '-')}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const COPILOT_OPTIONS = [
  { icon: 'NP', label: 'New Project', sub: 'Starting fresh, no prior submissions' },
  { icon: 'CE', label: 'Continuation of Existing Project', sub: 'Project already exists, requesting additional budget' },
  { icon: 'P2', label: 'Phase 2 or Later', sub: 'Subsequent phase of a multi-phase project' },
]

export default function NewProject() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ from: 'ai' | 'user'; text: string }[]>([
    { from: 'ai', text: 'Welcome to the Budget Copilot. Before we begin, I need some project context.' },
    { from: 'ai', text: 'Is this a new project, or a continuation of an existing initiative?' },
  ])
  const [optionSelected, setOptionSelected] = useState(false)

  const handleOptionSelect = (label: string) => {
    setChatMessages((prev) => [
      ...prev,
      { from: 'user', text: label },
      { from: 'ai', text: `Great. You selected "${label}". Please describe scope, beneficiaries, budget and timeline.` },
    ])
    setOptionSelected(true)
  }

  const handleSend = () => {
    if (!chatInput.trim()) return
    setChatMessages((prev) => [
      ...prev,
      { from: 'user', text: chatInput },
      { from: 'ai', text: 'Thanks. I am now structuring this into the required budget fields.' },
    ])
    setChatInput('')
  }

  return (
    <div className="max-w-[1080px] mx-auto space-y-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 py-5">
        <nav className="text-xs text-[#64748B] mb-2 flex items-center gap-1 flex-wrap">
          <Link to="/respondent/dashboard" className="hover:text-[var(--primary)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/respondent/projects" className="hover:text-[var(--primary)]">My Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--foreground)]">New Budget Item</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">New Budget Item</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Create a new budget request with modern guided form experience</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-2 w-full md:w-auto justify-center md:justify-start">
            <User className={cn('h-4 w-4', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
            <span className={cn('text-sm font-medium', mode === 'manual' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>Manual</span>
            <button
              onClick={() => setMode(mode === 'manual' ? 'ai' : 'manual')}
              className={cn('relative w-10 h-5 rounded-full transition-colors', mode === 'ai' ? 'bg-[var(--primary)]' : 'bg-[#CBD5E1]')}
            >
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', mode === 'ai' ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
            <span className={cn('text-sm font-medium', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')}>AI Copilot</span>
            <Bot className={cn('h-4 w-4', mode === 'ai' ? 'text-[var(--primary)]' : 'text-[#94A3B8]')} />
          </div>
        </div>
      </div>

      {mode === 'manual' ? (
        <>
          <Card className="rounded-2xl border-[#DCE6F1] shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <section className="p-4 sm:p-6 border-b border-[#EAF0F6]">
                <div className="flex items-center gap-3 mb-5">
                  <SectionNumber n={1} />
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Budget Item Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField label="Initiative / Budget Item Name" required>
                      <Input className="h-11 rounded-xl border-[#D7E1EC]" placeholder="Enter initiative name" />
                    </FormField>
                  </div>

                  <FormField label="Strategic Priorities" required>
                    <ModernSelect icon={Layers} placeholder="Select priority" options={['Government Services Excellence', 'Economic Diversification', 'Smart City Initiatives', 'Sustainability & Environment', 'Digital Infrastructure']} />
                  </FormField>

                  <FormField label="Strategic Priority Classifications" required>
                    <ModernSelect icon={FolderKanban} placeholder="Select classification" options={['Cloud & Hosting', 'AI & Automation', 'Security & Compliance', 'Enterprise Systems', 'Analytics']} />
                  </FormField>

                  <FormField label="Work Stream / Program Name">
                    <ModernSelect icon={Briefcase} placeholder="Select work stream" options={['Digital Transformation', 'Smart Government', 'Data Governance', 'Infrastructure Modernization']} />
                  </FormField>

                  <FormField label="ICT Budget Item Type" required>
                    <ModernSelect icon={Package} placeholder="Select type" options={['New', 'Enhancement', 'Continuation', 'Phase 2']} />
                  </FormField>

                  <FormField label="Technology (Company)">
                    <ModernSelect icon={Building2} placeholder="Select company" options={['Microsoft', 'Google', 'Amazon', 'Oracle', 'Cisco']} />
                  </FormField>

                  <FormField label="Technology (Product)">
                    <ModernSelect icon={Package} placeholder="Select product" options={['Azure', 'Google Cloud', 'AWS', 'Oracle Fusion', 'Prisma']} />
                  </FormField>

                  <FormField label="Category">
                    <ModernSelect icon={FolderKanban} placeholder="Select category" options={['Data Management', 'Citizen Services', 'Cybersecurity', 'Enterprise Applications', 'Infrastructure']} />
                  </FormField>
                </div>
              </section>

              <section className="p-4 sm:p-6 border-b border-[#EAF0F6]">
                <div className="flex items-center gap-3 mb-5">
                  <SectionNumber n={2} />
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Budget Item Timelines</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Planned Start Date" required>
                    <div className="relative">
                      <CalendarDays className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <Input type="date" className="h-11 rounded-xl border-[#D7E1EC] pl-9" />
                    </div>
                  </FormField>
                  <FormField label="Planned End Date" required>
                    <div className="relative">
                      <CalendarDays className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <Input type="date" className="h-11 rounded-xl border-[#D7E1EC] pl-9" />
                    </div>
                  </FormField>
                </div>
              </section>

              <section className="p-4 sm:p-6 border-b border-[#EAF0F6]">
                <div className="flex items-center gap-3 mb-5">
                  <SectionNumber n={3} />
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Summary</h3>
                </div>
                <FormField label="Summary / Description" required>
                  <Textarea rows={5} className="rounded-xl border-[#D7E1EC]" placeholder="Provide a detailed description of the budget item..." />
                </FormField>
              </section>

              <section className="p-4 sm:p-6 border-b border-[#EAF0F6]">
                <div className="flex items-center gap-3 mb-5">
                  <SectionNumber n={4} />
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Budget Type</h3>
                </div>
                <div className="max-w-md">
                  <FormField label="Budget Type" required>
                    <ModernSelect icon={Briefcase} placeholder="Select budget type" options={['CapEx', 'OpEx', 'Mixed']} />
                  </FormField>
                </div>
              </section>

              <section className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <SectionNumber n={5} />
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Budget Items</h3>
                  </div>
                  <Button size="sm" className="h-10 rounded-xl">
                    <Plus className="h-4 w-4" />
                    Add Budget Item
                  </Button>
                </div>

                <div className="rounded-xl border border-[#D7E1EC] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FAFC] border-b border-[#EAF0F6] hidden md:table-header-group">
                      <tr>
                        {['Account Name', 'Classification (L1/L2/L3)', 'EBS/Fusion Code / Expense Type', 'Budget Requested'].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="py-12 text-center px-4">
                          <div className="mx-auto w-12 h-12 rounded-full bg-[#EEF3F8] flex items-center justify-center mb-2">
                            <Plus className="h-5 w-5 text-[#94A3B8]" />
                          </div>
                          <p className="text-sm text-[#475569] font-medium">No budget items added</p>
                          <p className="text-xs text-[#94A3B8] mt-1">Click Add Budget Item or use copilot mode</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#DCE6F1] shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Documents</h3>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Upload className="h-4 w-4" />Upload Document
                </Button>
              </div>
              <div className="rounded-xl border-2 border-dashed border-[#D7E1EC] p-8 text-center hover:border-[var(--primary)] transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#475569]">Drop files here or click to upload</p>
                <p className="text-xs text-[#94A3B8] mt-1">PDF, DOCX, XLSX supported</p>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <Button variant="ghost" asChild className="w-full sm:w-auto"><Link to="/respondent/projects">Cancel</Link></Button>
              <Button variant="outline" className="w-full sm:w-auto">Save Draft</Button>
              <Button className="w-full sm:w-auto">Submit for Review</Button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col shadow-sm" style={{ minHeight: '560px' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--muted)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[var(--primary)]">Budget Copilot</p>
                <p className="text-xs text-[var(--primary)]/70">Interactive AI Assistant</p>
              </div>
            </div>
            <button className="text-xs text-[var(--primary)]/70 hover:text-[var(--primary)] flex items-center gap-1">
              <X className="h-3.5 w-3.5" />Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-[#F8FBFF] to-[#F2F7FC] dark:from-[#0F172A] dark:to-[#111C2B]">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.from === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.from === 'ai' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] mr-3 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-sm rounded-xl px-4 py-3 text-sm whitespace-pre-line',
                    msg.from === 'ai'
                      ? 'bg-white text-[var(--foreground)] border border-[#D7E1EC]'
                      : 'bg-[var(--primary)] text-white'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {!optionSelected && (
              <div className="ml-10 space-y-2">
                {COPILOT_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleOptionSelect(opt.label)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#D7E1EC] bg-white px-4 py-3 text-left hover:border-[var(--primary)] hover:bg-[#F7FAFE] transition-colors"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--muted)] text-[11px] font-semibold text-[var(--primary)]">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{opt.label}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--surface)]">
            <div className="flex gap-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe your project or ask a question..."
                className="flex-1 h-10 rounded-xl border border-[var(--primary-subtle)] bg-white px-4 text-sm text-[var(--foreground)] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              <button
                onClick={handleSend}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--primary)]/60 mt-2 text-center">Try: "Cloud migration project for AED 2M starting Q1 2026"</p>
          </div>
        </div>
      )}
    </div>
  )
}
