import { OnDemand_SendEntityBacktoPlanning_FromSMEReviewService } from '@/generated/services/OnDemand_SendEntityBacktoPlanning_FromSMEReviewService'

export const SME_REVIEW_RESET_SUCCESS_MESSAGE =
  'The entity has been reverted to the Planning stage successfully.'

function getFlowErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message).trim()
    if (message) return message
  }
  return 'The entity and its projects could not be moved back to Planning.'
}

export async function sendEntityBackToPlanning(instanceId: string): Promise<string> {
  const normalizedInstanceId = instanceId.replace(/[{}]/g, '').trim()
  if (!normalizedInstanceId) throw new Error('The selected entity does not have a valid ICT budget instance ID.')

  const result = await OnDemand_SendEntityBacktoPlanning_FromSMEReviewService.Run({
    text: normalizedInstanceId,
  })

  if (!result.success) throw new Error(getFlowErrorMessage(result.error))

  const response = result.data?.response?.trim()
  if (!response) throw new Error('The flow completed without returning a confirmation message.')

  return response
}
