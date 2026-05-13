import { getClient } from '@microsoft/power-apps/data'
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo'

const DATA_SOURCE_KEY = 'dga_webapiforportal'
const OPERATION_NAME = 'dga_WebApiForPortal'

export interface WebApiPortalDocument {
  sharepointdocumentid: string
  documentid: string | null
  fullname: string | null
  relativelocation: string | null
  sharepointcreatedon: string | null
  filetype: string | null
  absoluteurl: string | null
  modified: string | null
  sharepointmodifiedby: string | null
  title: string | null
  readurl: string | null
  editurl: string | null
  author: string | null
  ischeckedout: boolean
  locationid: string | null
  iconclassname: string | null
}

interface WebApiPortalResponse {
  retrieveResponse: WebApiPortalDocument[]
}

function buildSharePointDocumentFetchXml(budgetId: string): string {
  return `<fetch distinct='false' mapping='logical' returntotalrecordcount='true' page='1' count='50' no-lock='false'>
  <entity name='sharepointdocument'>
    <attribute name='documentid'/>
    <attribute name='fullname'/>
    <attribute name='relativelocation'/>
    <attribute name='sharepointcreatedon'/>
    <attribute name='filetype'/>
    <attribute name='absoluteurl'/>
    <attribute name='modified'/>
    <attribute name='sharepointmodifiedby'/>
    <attribute name='title'/>
    <attribute name='readurl'/>
    <attribute name='editurl'/>
    <attribute name='author'/>
    <attribute name='sharepointdocumentid'/>
    <attribute name='ischeckedout'/>
    <attribute name='locationid'/>
    <attribute name='iconclassname'/>
    <filter>
      <condition attribute='isrecursivefetch' operator='eq' value='1'/>
    </filter>
    <order attribute='relativelocation' descending='false'/>
    <link-entity name='dga_ict_budget' from='dga_ict_budgetid' to='regardingobjectid' alias='bb'>
      <filter type='and'>
        <condition attribute='dga_ict_budgetid' operator='eq' uitype='dga_ict_budget' value='${budgetId}'/>
      </filter>
    </link-entity>
  </entity>
</fetch>`
}

export async function retrieveSharePointDocumentsByBudget(budgetId: string): Promise<WebApiPortalDocument[]> {
  const client = getClient(dataSourcesInfo)
  const fetchXml = buildSharePointDocumentFetchXml(budgetId)

  console.log('[WebApiForPortalService] Calling dga_WebApiForPortal')
  console.log('[WebApiForPortalService] budgetId:', budgetId)
  console.log('[WebApiForPortalService] fetchXml:', fetchXml)
  console.log('[WebApiForPortalService] dataSourceKey:', DATA_SOURCE_KEY)
  console.log('[WebApiForPortalService] operationName:', OPERATION_NAME)

  const requestBody = {
    actionName: 'retrievemultiple',
    isAdmin: true,
    userId: '',
    fetchXml,
  }

  console.log('[WebApiForPortalService] requestBody:', requestBody)

  const result = await client.executeAsync<typeof requestBody, WebApiPortalResponse>({
    dataverseRequest: {
      action: 'customapi',
      parameters: {
        operationName: OPERATION_NAME,
        tableName: DATA_SOURCE_KEY,
        body: requestBody,
      },
    },
  })

  console.log('[WebApiForPortalService] Raw result:', result)
  console.log('[WebApiForPortalService] result.success:', result.success)
  console.log('[WebApiForPortalService] result.data:', result.data)
  console.log('[WebApiForPortalService] result.error:', result.error)

  if (!result.success) {
    const errMsg = result.error instanceof Error ? result.error.message : String(result.error?.message ?? result.error)
    console.error('[WebApiForPortalService] Call failed:', errMsg)
    throw new Error(`dga_WebApiForPortal failed: ${errMsg}`)
  }

  const docs = result.data?.retrieveResponse ?? []
  console.log('[WebApiForPortalService] Documents retrieved:', docs.length, docs)
  return docs
}
