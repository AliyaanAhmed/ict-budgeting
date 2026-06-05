import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, MessageSquare, Search, ShieldCheck, Sparkles, TriangleAlert, Workflow } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StrategyPageShell, StrategyPill } from './StrategyTeamShell'
import { qualityCheckItems } from './strategyTeamData'

const tabs = ['All', 'Recommended', 'Not Recommended', 'Clarification Pending'] as const

function SummaryAccordion() {
  const [open, setOpen] = useState(false)

  return (
    <Card className="overflow-hidden rounded-[28px] border-[#E9D5FF] bg-white shadow-[0_14px_30px_rgba(168,85,247,0.08)] dark:border-white/10 dark:bg-[#1E293B]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 bg-gradient-to-b from-[#FDF8FF] via-white to-white px-6 py-5 text-left transition-colors hover:bg-white/40 dark:from-[#2A123D] dark:via-[#1F1B2E] dark:to-[#1E293B] dark:hover:bg-white/5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-[0_12px_24px_rgba(168,85,247,0.24)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-[#0F172A] dark:text-white">AI Quality Check Summary</h2>
              <span className="inline-flex rounded-full bg-[#F5EEFF] px-2.5 py-1 text-xs font-semibold text-[#A855F7] dark:bg-[#A855F7]/15 dark:text-[#E9D5FF]">
                Governing View
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#475569] dark:text-slate-100">
              Portfolio-level quality signals, confidence patterns, and what needs closer governance review.
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-[#64748B] dark:text-slate-300" /> : <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-[#64748B] dark:text-slate-300" />}
      </button>

      {open ? (
        <div className="border-t border-[#E9D5FF] px-6 py-5 dark:border-white/10">
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[#F97316]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Confidence Analysis</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#F97316]" /><span><strong>1</strong> projects have low confidence and need closer quality review</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#F97316]" /><span><strong>2</strong> recommended items have unresolved ambiguity in evidence</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#F97316]" /><span>Budget variance detected in <strong>1</strong> high-value project</span></li>
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-[#10B981]">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Recommendation Quality</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#10B981]" /><span><strong>4</strong> recommendations appear consistent with evidence</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#10B981]" /><span><strong>1</strong> not-recommended item needs verification</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#10B981]" /><span><strong>1</strong> recommendation may conflict with supporting documents</span></li>
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-[#EF4444]">
                <TriangleAlert className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Justification Issues</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#EF4444]" /><span><strong>0</strong> not-recommended items have weak or brief SME comment</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#EF4444]" /><span><strong>1</strong> comment does not clearly explain rejection reason</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#EF4444]" /><span>Cybersecurity project needs stronger NCA documentation note</span></li>
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-[#A855F7]">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Ambiguity Detection</p>
              </div>
              <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#A855F7]" /><span><strong>2</strong> projects still show unclear scope or evidence</span></li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#A855F7]" /><span><strong>0</strong> may need clarification before Director review</span></li>
              </ul>
              <div className="mt-4">
                <div className="mb-3 flex items-center gap-2 text-[#7C3AED]">
                  <Workflow className="h-4 w-4" />
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Routing Risk</p>
                </div>
                <ul className="space-y-2 text-sm leading-6 text-[#475569] dark:text-slate-300">
                  <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#7C3AED]" /><span><strong>1</strong> project may need QC hold before routing</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#E9D5FF] pt-5 dark:border-white/10">
            <div className="mb-3 flex items-center gap-2">
              <Workflow className="h-4 w-4 text-[#10B981]" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Recommended Actions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Review 1 low-confidence items closely',
                'Verify justification for 0 not-recommended items',
                'Consider clarification for ambiguous evidence cases',
                'Route 2 high-confidence items to Director',
              ].map((action) => (
                <span key={action} className="inline-flex items-center gap-2 rounded-full border border-[#D7E4F4] bg-white px-3 py-1.5 text-sm text-[#475569] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-[#A855F7]" />
                  {action}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-[#D97706]/30 bg-[#FFF7ED] px-4 py-2 text-sm font-semibold text-[#D97706] transition-colors hover:bg-[#FFEDD5]" type="button">
              Open Low Confidence Cases
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-[#EF4444]/30 bg-[#FEF2F2] px-4 py-2 text-sm font-semibold text-[#EF4444] transition-colors hover:bg-[#FEE2E2]" type="button">
              Open Weak Justification Cases
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-[#F97316]/30 bg-[#FFF7ED] px-4 py-2 text-sm font-semibold text-[#F97316] transition-colors hover:bg-[#FFEDD5]" type="button">
              Open Clarification-Likely Cases
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-[#A855F7]/30 bg-[#F5EEFF] px-4 py-2 text-sm font-semibold text-[#A855F7] transition-colors hover:bg-[#E9D5FF]" type="button">
              Open Ambiguous Projects
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-[#10B981] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#059669]" type="button">
              Route High-Confidence to Director
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

export default function QualityCheck() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All')
  const [search, setSearch] = useState('')

  const tabCounts = useMemo(
    () =>
      tabs.map((tab) => ({
        label: tab,
        count:
          tab === 'All'
            ? qualityCheckItems.length
            : tab === 'Recommended'
              ? qualityCheckItems.filter((item) => item.severity === 'Info').length
              : tab === 'Not Recommended'
                ? qualityCheckItems.filter((item) => item.severity === 'Critical').length
                : qualityCheckItems.filter((item) => item.statuscode.includes('Awaiting')).length,
      })),
    []
  )

  const filteredItems = useMemo(() => {
    const searched = qualityCheckItems.filter((item) =>
      `${item.id} ${item.name} ${item.entity} ${item.classification} ${item.priority}`.toLowerCase().includes(search.toLowerCase())
    )

    return searched.filter((item) =>
      activeTab === 'Recommended'
        ? item.severity === 'Info'
        : activeTab === 'Not Recommended'
          ? item.severity === 'Critical'
          : activeTab === 'Clarification Pending'
            ? item.statuscode.includes('Awaiting')
            : true
    )
  }, [activeTab, search])

  return (
    <StrategyPageShell
      eyebrow="ICT - Strategy Team"
      title="Quality Check"
      description="Validate strategic quality before the portfolio advances. The view highlights confidence, evidence strength, and what needs closer governance review."
    >
      <section className="space-y-5">
        <SummaryAccordion />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search QC projects..."
              className="h-10 rounded-2xl border-[#D7E4F4] bg-white pl-10 text-sm dark:border-white/10 dark:bg-[#1E293B]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tabCounts.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(tab.label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.label
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_10px_22px_rgba(40,108,255,0.18)]'
                    : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === tab.label ? 'bg-white/20' : 'bg-[#F1F5F9] dark:bg-white/10'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden rounded-[22px] border-[#DCE6F6] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BFD4FF] hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#162339]">
              <CardContent className="p-0">
                <div className="flex w-full flex-col gap-4 px-5 py-4 text-left">
                  <div className="flex w-full items-start justify-between gap-4 border-b border-[#EEF3F8] pb-4 dark:border-white/10">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[17px] font-semibold text-[#0F172A] dark:text-white">
                          {item.id} {item.name}
                        </p>
                        <StrategyPill tone={item.severity === 'Critical' ? 'amber' : item.severity === 'Warning' ? 'blue' : 'teal'}>
                          {item.severity}
                        </StrategyPill>
                      </div>
                      <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                        {item.entity} · {item.classification} · {item.priority}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0F172A] dark:text-white">{item.confidence}%</p>
                      <p className="text-xs text-[#64748B] dark:text-slate-300">Confidence</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="flex flex-col rounded-[20px] border border-[#EAF0F6] bg-white p-4 transition-shadow hover:shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#17243A]">
                      <label className="mb-2 block text-xs font-medium tracking-wide text-[#0F172A] dark:text-white">SME Recommendation</label>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#4A9D5C]/30 bg-[#4A9D5C]/10 px-4 py-2">
                        <ShieldCheck className="h-5 w-5 text-[#4A9D5C]" />
                        <span className="font-medium text-[#4A9D5C]">Recommended — Approve</span>
                      </div>
                      <div className="mb-2 text-xs text-[#64748B] dark:text-slate-300">Dr. Fatima Al Rashdi · Cloud Infrastructure · 08 Apr 2026</div>
                      <p className="text-sm leading-6 text-[#0F172A] dark:text-white">
                        Technically sound with clear cost justification. The proposed architecture aligns with government cloud standards and the vendor has strong track record.
                      </p>
                      <button type="button" className="mt-2 text-xs font-medium text-[#286CFF] hover:underline">
                        Show less
                      </button>
                    </div>

                    <div className="flex flex-col rounded-[20px] border border-[#E9D5FF] bg-[#FDF8FF] p-4 transition-shadow hover:shadow-[0_10px_22px_rgba(168,85,247,0.08)] dark:border-white/10 dark:bg-[#2A123D]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide text-[#0F172A] dark:text-white">AI Quality Insight</span>
                        <Sparkles className="h-4 w-4 text-[#A855F7]" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#0F172A] dark:text-white">{item.adjustment}</p>
                    </div>

                    <div className="flex flex-col rounded-[20px] border border-[#EAF0F6] bg-white p-4 transition-shadow hover:shadow-[0_10px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#17243A]">
                      <label className="mb-2 block text-xs font-medium tracking-wide text-[#0F172A] dark:text-white">Budget Adjustment</label>
                      <div className="mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[#94A3B8] line-through">Original: د.إ 2,400,000</span>
                          <span className="text-sm font-semibold text-[#0F172A] dark:text-white">Adjusted: د.إ 2,100,000</span>
                        </div>
                        <span className="mt-2 inline-flex w-fit items-center justify-center rounded-md border border-[#D97706]/30 bg-[#D97706]/10 px-2 py-0.5 text-xs font-medium text-[#D97706]">
                          ↓ 13% vs requested
                        </span>
                      </div>
                      <div className="mt-auto">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#286CFF]">78% Confidence</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4F98FF]" />
                          </div>
                          <div className="h-1.5 rounded-full bg-[#E7F5FF]">
                            <div className="h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, rgb(160, 213, 171), rgb(74, 157, 92))', width: '78%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF0F6] pt-4 dark:border-white/10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#F8FBFF] px-3 py-1.5 text-xs font-semibold text-[#475569] dark:bg-white/5 dark:text-slate-300">
                      <ShieldCheck className="h-4 w-4 text-[#286CFF]" />
                      {item.id} budget codes
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-[#D7E4F4] bg-white px-3 py-2 text-sm font-medium text-[#286CFF] transition-colors hover:bg-[#EEF5FF] dark:border-white/10 dark:bg-[#1E293B] dark:text-white dark:hover:bg-white/5"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Request Clarification
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-[#043DFF] bg-[#286CFF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0C65F5]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Full Detail
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-[#043DFF] bg-[#286CFF] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0C65F5]"
                      >
                        <Workflow className="h-4 w-4" />
                        Route to Director
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StrategyPageShell>
  )
}
