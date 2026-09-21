export const appConfig = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE || 'mock') as 'mock' | 'dataverse',
}
