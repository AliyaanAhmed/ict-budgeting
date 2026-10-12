import type { ClassificationRecord } from '@/domain/classification'

export interface ClassificationsApi {
  getAll(): Promise<ClassificationRecord[]>
}
