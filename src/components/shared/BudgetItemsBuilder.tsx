import { useMemo, useState } from 'react'
import { CircleDollarSign, Plus, Trash2 } from 'lucide-react'
import type { BudgetItemDraft } from '@/domain/classification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyAmount } from '@/components/shared/CurrencyAmount'
import { ClassificationPickerModal } from '@/components/shared/ClassificationPickerModal'

interface BudgetItemsBuilderProps {
  items: BudgetItemDraft[]
  onChange: (items: BudgetItemDraft[]) => void
}

export function BudgetItemsBuilder({ items, onChange }: BudgetItemsBuilderProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const totalRequested = useMemo(
    () => items.reduce((sum, item) => sum + item.budgetRequested, 0),
    [items]
  )

  const addItems = (newItems: BudgetItemDraft[]) => {
    const existingIds = new Set(items.map((item) => item.id))
    const uniqueItems = newItems.filter((item) => !existingIds.has(item.id))
    if (uniqueItems.length === 0) return
    onChange([...items, ...uniqueItems])
  }

  const updateBudgetRequested = (id: string, value: string) => {
    const nextValue = Number.parseInt(value, 10)
    onChange(
      items.map((item) =>
        item.id === id
          ? { ...item, budgetRequested: Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0 }
          : item
      )
    )
  }

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Line Items</p>
              <p className="mt-1 text-2xl font-bold text-[#0F172A] dark:text-white">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">CapEx / OpEx Tags</p>
              <p className="mt-1 text-sm font-bold text-[#0F172A] dark:text-white">
                {items.length === 0 ? 'Not set' : Array.from(new Set(items.map((item) => item.expenseTypeLabel ?? 'Unspecified'))).join(', ')}
              </p>
            </div>
            <div className="rounded-2xl border border-[#B0DBFF] bg-[linear-gradient(180deg,#EAF4FF_0%,#FFFFFF_100%)] px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#286CFF]/10">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300">Total Requested</p>
              <CurrencyAmount amount={totalRequested} full className="mt-1 text-lg font-bold text-[#286CFF]" iconSize={16} />
            </div>
          </div>

          <Button size="sm" className="h-10 rounded-xl shadow-sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Budget Item
          </Button>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[#DDEBFF] bg-white shadow-inner dark:border-white/10 dark:bg-[#0F172A]/20">
          <table className="w-full text-sm">
            <thead className="hidden border-b border-[#EAF0F6] bg-[#F8FAFC] md:table-header-group dark:border-white/10 dark:bg-[#0F172A]/20">
              <tr>
                {['Account Name', 'Classification Path', 'EBS / Fusion / Type', 'Budget Requested', 'Actions'].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3 text-start text-xs font-bold text-[#64748B] dark:text-slate-200">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9F4FF]">
                      <CircleDollarSign className="h-6 w-6 text-[var(--primary)]" />
                    </div>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">No budget items added yet</p>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-200">
                      Use the classification picker to add GL accounts and then enter each requested amount.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="block border-t border-[#F1F5F9] p-4 align-top dark:border-white/5 md:table-row md:p-0">
                    <td className="block py-2 md:table-cell md:px-4 md:py-4">
                      <div className="font-semibold text-[#0F172A] dark:text-white">{item.accountName}</div>
                      <div className="mt-1 text-xs text-[#64748B] dark:text-slate-300">{item.glCode}</div>
                    </td>
                    <td className="block py-2 md:table-cell md:px-4 md:py-4">
                      <div className="text-sm font-medium text-[#334155] dark:text-slate-100">{item.l1}</div>
                      <div className="mt-1 text-xs text-[#64748B] dark:text-slate-300">
                        {item.l2} / {item.l3}
                      </div>
                    </td>
                    <td className="block py-2 md:table-cell md:px-4 md:py-4">
                      <div className="text-xs font-semibold text-[#286CFF]">EBS {item.ebsCode}</div>
                      <div className="mt-1 text-xs text-[#64748B] dark:text-slate-300">Fusion {item.fusionCode}</div>
                      <div className="mt-2 inline-flex rounded-full bg-[#E7F5FF] px-2 py-0.5 text-[11px] font-semibold text-[#286CFF] dark:bg-[#286CFF]/15">
                        {item.expenseTypeLabel ?? 'Expense Type Pending'}
                      </div>
                    </td>
                    <td className="block py-2 md:table-cell md:px-4 md:py-4">
                      <div className="max-w-[180px]">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={item.budgetRequested}
                          onChange={(event) => updateBudgetRequested(item.id, event.target.value)}
                          className="h-11 rounded-xl border-[#D9E6F7]"
                        />
                      </div>
                    </td>
                    <td className="block py-2 md:table-cell md:px-4 md:py-4">
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClassificationPickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        existingItems={items}
        onCreate={addItems}
      />
    </>
  )
}
