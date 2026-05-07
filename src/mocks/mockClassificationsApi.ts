import type { ClassificationRecord } from '@/domain/classification'
import type { ClassificationsApi } from '@/api/classificationsApi'

const records: ClassificationRecord[] = [
  { id: 'l1-software', name: 'Software Testing 2.0', arabicName: null, level: 1, levelLabel: 'Level 1', parentId: null, parentName: null, parentLookupLogicalName: null, ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l1-ai', name: 'AI', arabicName: null, level: 1, levelLabel: 'Level 1', parentId: null, parentName: null, parentLookupLogicalName: null, ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l1-artificial-intelligence', name: 'Artificial Intelligence', arabicName: null, level: 1, levelLabel: 'Level 1', parentId: null, parentName: null, parentLookupLogicalName: null, ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l1-business-specific', name: 'Business Specific', arabicName: null, level: 1, levelLabel: 'Level 1', parentId: null, parentName: null, parentLookupLogicalName: null, ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l2-platforms', name: 'Platforms', arabicName: null, level: 2, levelLabel: 'Level 2', parentId: 'l1-artificial-intelligence', parentName: 'Artificial Intelligence', parentLookupLogicalName: 'dga_classification', ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l2-operations', name: 'Operations', arabicName: null, level: 2, levelLabel: 'Level 2', parentId: 'l1-artificial-intelligence', parentName: 'Artificial Intelligence', parentLookupLogicalName: 'dga_classification', ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l2-cloud', name: 'Cloud', arabicName: null, level: 2, levelLabel: 'Level 2', parentId: 'l1-artificial-intelligence', parentName: 'Artificial Intelligence', parentLookupLogicalName: 'dga_classification', ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l2-prof-services', name: 'Professional Services', arabicName: null, level: 2, levelLabel: 'Level 2', parentId: 'l1-software', parentName: 'Software Testing 2.0', parentLookupLogicalName: 'dga_classification', ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l3-licenses', name: 'Licenses', arabicName: null, level: 3, levelLabel: 'Level 3', parentId: 'l2-platforms', parentName: 'Platforms', parentLookupLogicalName: 'dga_classification', ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l3-implementation', name: 'Implementation', arabicName: null, level: 3, levelLabel: 'Level 3', parentId: 'l2-platforms', parentName: 'Platforms', parentLookupLogicalName: 'dga_classification', ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'l3-renewal', name: 'Renewal', arabicName: null, level: 3, levelLabel: 'Level 3', parentId: 'l2-operations', parentName: 'Operations', parentLookupLogicalName: 'dga_classification', ebsCode: null, fusionCode: null, expenseTypeValue: null, expenseTypeLabel: null },
  { id: 'gl-license-renewal', name: 'Artificial Intelligence Platforms - License Renewal', arabicName: null, level: 4, levelLabel: 'Budget Account', parentId: 'l3-licenses', parentName: 'Licenses', parentLookupLogicalName: 'dga_classification', ebsCode: '426618', fusionCode: '422919', expenseTypeValue: 2, expenseTypeLabel: 'OpEx' },
  { id: 'gl-implementation', name: 'Implementation (Platforms - Artificial Intelligence) - L3002', arabicName: null, level: 4, levelLabel: 'Budget Account', parentId: 'l3-implementation', parentName: 'Implementation', parentLookupLogicalName: 'dga_classification', ebsCode: '420815', fusionCode: 'N/A', expenseTypeValue: 1, expenseTypeLabel: 'CapEx' },
  { id: 'gl-ai-subscription', name: 'AI Platform Subscription', arabicName: null, level: 4, levelLabel: 'Budget Account', parentId: 'l3-renewal', parentName: 'Renewal', parentLookupLogicalName: 'dga_classification', ebsCode: '441220', fusionCode: '441220', expenseTypeValue: 2, expenseTypeLabel: 'OpEx' },
]

export const mockClassificationsApi: ClassificationsApi = {
  async getAll() {
    return records
  },
}
