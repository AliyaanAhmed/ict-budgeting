import type {
  Dga_technologies,
  Dga_technologiesBase,
} from '@/generated/models/Dga_technologiesModel'
import { Dga_technologiesService } from '@/generated/services/Dga_technologiesService'

export interface TechnologyProductOption {
  id: string
  name: string
  typeValue: 1
  typeLabel: string
}

export interface TechnologyCompanyOption {
  id: string
  name: string
  typeValue: 2
  typeLabel: string
  products: TechnologyProductOption[]
}

function normalizeProduct(record: Dga_technologies): TechnologyProductOption | null {
  if (!record.dga_technologyid || !record.dga_technology_name || record.dga_technologytype !== 1) {
    return null
  }

  return {
    id: record.dga_technologyid,
    name: record.dga_technology_name,
    typeValue: 1,
    typeLabel: record.dga_technologytypename || 'Product',
  }
}

export async function getTechnologyCompanies() {
  const result = await Dga_technologiesService.getAll({
    select: ['dga_technologyid', 'dga_technology_name', 'dga_technologytype'],
    orderBy: ['dga_technology_name asc'],
  })

  const records = result.data ?? []
  const allProducts = records
    .map(normalizeProduct)
    .filter((product): product is TechnologyProductOption => product !== null)
    .sort((left, right) => left.name.localeCompare(right.name))

  return records
    .map((record) => {
      if (!record.dga_technologyid || !record.dga_technology_name || record.dga_technologytype !== 2) {
        return null
      }

      return {
        id: record.dga_technologyid,
        name: record.dga_technology_name,
        typeValue: 2,
        typeLabel: record.dga_technologytypename || 'Company',
        products: allProducts,
      } satisfies TechnologyCompanyOption
    })
    .filter((record): record is TechnologyCompanyOption => record !== null)
}

export async function createTechnologyProductForCompany(companyId: string, name: string) {
  const createResult = await Dga_technologiesService.create({
    dga_technology_name: name.trim(),
    dga_technologytype: 1,
    'dga_technology_product_company@odata.bind': [`/dga_technologies(${companyId})`],
  } as Partial<Omit<Dga_technologiesBase, 'dga_technologyid'>> as Omit<
    Dga_technologiesBase,
    'dga_technologyid'
  >)

  const created = createResult.data as Dga_technologies | undefined

  if (!created?.dga_technologyid) {
    throw new Error('Technology product was created, but the response was incomplete.')
  }

  return {
    id: created.dga_technologyid,
    name: created.dga_technology_name?.trim() || name.trim(),
    typeValue: 1,
    typeLabel: created.dga_technologytypename || 'Product',
  } satisfies TechnologyProductOption
}
