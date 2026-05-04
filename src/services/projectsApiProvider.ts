import { appConfig } from '@/config'
import { mockProjectsApi } from '@/mocks/mockProjectsApi'
import { dataverseProjectsApi } from '@/api/dataverse/dataverseProjectsApi'
import type { ProjectsApi } from '@/api/projectsApi'

export const projectsApi: ProjectsApi =
  appConfig.dataSource === 'dataverse' ? dataverseProjectsApi : mockProjectsApi
