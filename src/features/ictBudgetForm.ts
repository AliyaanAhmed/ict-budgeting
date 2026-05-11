import type {
  Dga_ict_budgetsdga_activity_type,
  Dga_ict_budgetsdga_budget_item_type,
  Dga_ict_budgetsdga_category,
} from '@/generated/models/Dga_ict_budgetsModel'

export type ActivityType = Dga_ict_budgetsdga_activity_type
export type BudgetItemType = Dga_ict_budgetsdga_budget_item_type
export type CategoryType = Dga_ict_budgetsdga_category

export interface IctBudgetFormValues {
  initiativeName: string
  strategicPriorityId: string
  strategicPriorityClassificationId: string
  workStreamId: string
  technologyCompanyId: string
  technologyProductIds: string[]
  budgetItemType: BudgetItemType | null
  plannedStartDate: string
  plannedEndDate: string
  summary: string
  activityType: ActivityType | null
  category: CategoryType | null
  totalBudgetPaidPreviousYear: string
  totalBudgetPayableFutureYear: string
  totalBudgetPayableNextYear: string
  totalBudgetPayableForYearAfterNext: string
}

export type BudgetCurrencyField =
  | 'totalBudgetPaidPreviousYear'
  | 'totalBudgetPayableFutureYear'
  | 'totalBudgetPayableNextYear'
  | 'totalBudgetPayableForYearAfterNext'

export type IctBudgetFieldErrorMap = Partial<
  Record<keyof IctBudgetFormValues | 'budgetItems', string>
>

export const ACTIVITY_TYPE_OPTIONS: Array<{
  value: ActivityType
  title: string
  description: string
}> = [
  {
    value: 1,
    title: 'Operational Recurring',
    description: 'Recurring operational spend with current and future year obligations.',
  },
  {
    value: 2,
    title: 'Operational Non-Recurring',
    description: 'One-time operational spend without extra year-based budget fields.',
  },
  {
    value: 3,
    title: 'New Project',
    description: 'New delivery initiative with future-year budget planning fields.',
  },
  {
    value: 4,
    title: 'Project Continuation',
    description: 'Continuation of an active project with historical and future spend.',
  },
]

export const BUDGET_ITEM_TYPE_OPTIONS: Array<{ value: BudgetItemType; label: string }> = [
  { value: 1, label: 'New Strategic Initiative' },
  { value: 2, label: 'New CAPEX' },
  { value: 3, label: 'Inorganic Growth' },
  { value: 4, label: 'Other' },
]

export const CATEGORY_OPTIONS: Array<{ value: CategoryType; label: string }> = [
  { value: 1, label: 'ICT Only' },
  { value: 2, label: 'Part of Any Other Project' },
]

export const INITIAL_ICT_BUDGET_FORM_VALUES: IctBudgetFormValues = {
  initiativeName: '',
  strategicPriorityId: '',
  strategicPriorityClassificationId: '',
  workStreamId: '',
  technologyCompanyId: '',
  technologyProductIds: [],
  budgetItemType: null,
  plannedStartDate: '',
  plannedEndDate: '',
  summary: '',
  activityType: null,
  category: null,
  totalBudgetPaidPreviousYear: '',
  totalBudgetPayableFutureYear: '',
  totalBudgetPayableNextYear: '',
  totalBudgetPayableForYearAfterNext: '',
}

export function formatIntegerInput(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (!digitsOnly) return ''
  return Number.parseInt(digitsOnly, 10).toLocaleString('en-AE')
}

export function parseCurrencyValue(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (!digitsOnly) return null
  const parsed = Number.parseInt(digitsOnly, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function getVisibleBudgetFields(activityType: ActivityType | null) {
  switch (activityType) {
    case 1:
    case 4:
      return [
        'totalBudgetPaidPreviousYear',
        'totalBudgetPayableFutureYear',
        'totalBudgetPayableNextYear',
        'totalBudgetPayableForYearAfterNext',
      ] as BudgetCurrencyField[]
    case 2:
      return [] as BudgetCurrencyField[]
    case 3:
      return [
        'totalBudgetPayableFutureYear',
        'totalBudgetPayableNextYear',
        'totalBudgetPayableForYearAfterNext',
      ] as BudgetCurrencyField[]
    default:
      return [] as BudgetCurrencyField[]
  }
}

export function toCurrencyFieldLabel(field: BudgetCurrencyField) {
  switch (field) {
    case 'totalBudgetPaidPreviousYear':
      return 'Total Budget Paid Previous Year'
    case 'totalBudgetPayableFutureYear':
      return 'Total Budget Payable Future Years'
    case 'totalBudgetPayableNextYear':
      return 'Total Budget Payable Next Year'
    case 'totalBudgetPayableForYearAfterNext':
      return 'Total Budget Payable For Year After Next'
    default:
      return ''
  }
}

