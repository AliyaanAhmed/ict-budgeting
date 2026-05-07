import type {
  Dga_ict_budgetsBase,
  Dga_ict_budgetsdga_activity_type,
  Dga_ict_budgetsdga_budget_item_type,
} from '@/generated/models/Dga_ict_budgetsModel'
import { Dga_ict_budgetsService } from '@/generated/services/Dga_ict_budgetsService'

export interface CreateIctBudgetDraftInput {
  initiativeName: string
  strategicPriorityId: string
  strategicPriorityClassificationId: string
  workStreamId: string | null
  technologyCompanyId: string | null
  technologyProductIds: string[]
  plannedStartDate: string
  plannedEndDate: string
  summary: string
  activityType: Dga_ict_budgetsdga_activity_type
  budgetItemType: Dga_ict_budgetsdga_budget_item_type
  totalBudgetPaidPreviousYear: number | null
  totalBudgetPayableFutureYear: number | null
  totalBudgetPayableNextYear: number | null
  totalBudgetPayableForYearAfterNext: number | null
}

function toLookupBinding(entitySet: string, id: string | null) {
  return id ? `/${entitySet}(${id})` : undefined
}

export async function createIctBudgetDraft(input: CreateIctBudgetDraftInput) {
  const payload = {
    dga_initiative_project_requirement_name: input.initiativeName.trim(),
    'dga_previous_strategic_priority@odata.bind': toLookupBinding(
      'dga_strategic_prioritieses',
      input.strategicPriorityId
    ),
    'dga_previous_strategic_priorityclassification@odata.bind': toLookupBinding(
      'dga_strategic_prioritieses',
      input.strategicPriorityClassificationId
    ),
    'dga_strategic_priority@odata.bind': toLookupBinding(
      'dga_strategic_prioritieses',
      input.strategicPriorityId
    ),
    'dga_strategic_priority_classification@odata.bind': toLookupBinding(
      'dga_strategic_prioritieses',
      input.strategicPriorityClassificationId
    ),
    'dga_work_stream@odata.bind': toLookupBinding('dga_work_streams', input.workStreamId),
    'dga_technology_company@odata.bind': toLookupBinding(
      'dga_technologies',
      input.technologyCompanyId
    ),
    'dga_ict_budget_technology_product@odata.bind':
      input.technologyProductIds.length > 0
        ? input.technologyProductIds.map((id) => `/dga_technologies(${id})`)
        : undefined,
    dga_planned_start_date: input.plannedStartDate,
    dga_planned_end_date: input.plannedEndDate,
    dga_summary: input.summary.trim(),
    dga_activity_type: input.activityType,
    dga_budget_item_type: input.budgetItemType,
    dga_total_budget_paid_previous_year: input.totalBudgetPaidPreviousYear ?? undefined,
    dga_total_budget_payable_future_year: input.totalBudgetPayableFutureYear ?? undefined,
    dga_total_budget_payable_next_year: input.totalBudgetPayableNextYear ?? undefined,
    dga_total_budget_payable_for_year_after_next:
      input.totalBudgetPayableForYearAfterNext ?? undefined,
  } as Partial<Omit<Dga_ict_budgetsBase, 'dga_ict_budgetid'>> as Omit<
    Dga_ict_budgetsBase,
    'dga_ict_budgetid'
  >

  const result = await Dga_ict_budgetsService.create(payload)

  if (!result.data?.dga_ict_budgetid) {
    throw new Error('ICT budget record was created, but the response did not include an id.')
  }

  return result.data.dga_ict_budgetid
}
