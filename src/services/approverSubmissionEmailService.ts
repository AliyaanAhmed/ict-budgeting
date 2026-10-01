import { Dga_ict_budget_instancesService } from '@/generated/services/Dga_ict_budget_instancesService'
import { PowerAppV2_OnSubmittoDGEbyApprover_SendEmailtoStrategyTeamService } from '@/generated/services/PowerAppV2_OnSubmittoDGEbyApprover_SendEmailtoStrategyTeamService'

export async function sendApproverSubmissionEmail(instanceId: string): Promise<void> {
  const instance = await Dga_ict_budget_instancesService.get(instanceId, { select: ['dga_entity_abbr'] })
  if (!instance.success) throw new Error('Unable to retrieve the entity abbreviation for the notification.')
  const abbr = instance.data?.dga_entity_abbr?.trim()
  if (!abbr) throw new Error('The entity abbreviation is missing. The Strategy Team email was not requested.')
  const result = await PowerAppV2_OnSubmittoDGEbyApprover_SendEmailtoStrategyTeamService.Run({
    text: instanceId,
    text_1: abbr,
  })
  if (!result.success) throw new Error('The Strategy Team email flow could not be started.')
}
