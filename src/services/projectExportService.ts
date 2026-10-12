import ExcelJS from 'exceljs'
import type { Project } from '@/domain/types'
import {
  getBudgetLineItemsByBudgetIds,
  type BudgetLineItemRecord,
} from '@/services/budgetLineItemService'
import { getIctBudgetDraftById } from '@/services/ictBudgetDraftService'
import { getTechnologyCompanies } from '@/services/technologyService'
import { getWorkStreamOptions } from '@/services/workStreamService'
import { BUDGET_ITEM_TYPE_OPTIONS, CATEGORY_OPTIONS } from '@/features/ictBudgetForm'

const COLORS = {
  primary: 'FF286CFF',
  primaryDark: 'FF1E5AE8',
  primaryMid: 'FF4F98FF',
  primaryLight: 'FF81C1FF',
  primaryPale: 'FFB0DBFF',
  primarySoft: 'FFF8FBFF',
  border: 'FFDDEBFF',
  text: 'FF0F172A',
  muted: 'FF64748B',
  white: 'FFFFFFFF',
  altRow: 'FFFBFDFF',
}

type ExportProjectRecord = Project & {
  category: string
  workStream: string
  budgetType: string
  technology: {
    company: string
    product: string
  }
}

const BASIC_COLUMNS = [
  { header: 'Project ID', width: 16, value: (project: ExportProjectRecord) => project.id },
  { header: 'Project Name', width: 30, value: (project: ExportProjectRecord) => project.name },
  { header: 'Status', width: 20, value: (project: ExportProjectRecord) => project.status },
  { header: 'Strategic Priority', width: 24, value: (project: ExportProjectRecord) => project.strategicPriority },
  { header: 'Classification', width: 24, value: (project: ExportProjectRecord) => project.classification },
  { header: 'Category', width: 20, value: (project: ExportProjectRecord) => project.category },
  { header: 'Work Stream', width: 22, value: (project: ExportProjectRecord) => project.workStream },
  { header: 'Budget Type', width: 18, value: (project: ExportProjectRecord) => project.budgetType },
  { header: 'Technology Company', width: 22, value: (project: ExportProjectRecord) => project.technology.company },
  { header: 'Technology Product', width: 22, value: (project: ExportProjectRecord) => project.technology.product },
  { header: 'Submitted By', width: 20, value: (project: ExportProjectRecord) => project.submittedBy },
  { header: 'Pending With', width: 18, value: (project: ExportProjectRecord) => project.pendingWith ?? '-' },
  { header: 'د.إ Requested Budget', width: 18, value: (project: ExportProjectRecord) => project.requestedBudget, type: 'currency' as const },
]

interface ExportLineItem {
  key: string
  glLabel: string
  l1: string
  l2: string
  l3: string
  requestedBudget: number
}

interface ClassificationLeaf {
  key: string
  glLabel: string
  l1: string
  l2: string
  l3: string
}

function formatDateStamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

function currencyCell(cell: ExcelJS.Cell, value: number) {
  cell.value = value
  cell.numFmt = '"د.إ " #,##0.00'
}

function makeLeafKey(l1: string, l2: string, l3: string, glLabel: string) {
  return [l1, l2, l3, glLabel].join('|||')
}

function fallbackGlLabel(projectItem: Project['budgetItems'][number]) {
  return projectItem.glCode?.trim() || projectItem.accountName?.trim() || '-'
}

function buildFallbackLineItems(project: Project): ExportLineItem[] {
  return project.budgetItems.map((item) => ({
    key: makeLeafKey(item.l1 || '-', item.l2 || '-', item.l3 || '-', fallbackGlLabel(item)),
    glLabel: fallbackGlLabel(item),
    l1: item.l1 || '-',
    l2: item.l2 || '-',
    l3: item.l3 || '-',
    requestedBudget: item.budgetRequested,
  }))
}

function buildResolvedLineItems(
  project: Project,
  lineItemsByBudgetId: Map<string, BudgetLineItemRecord[]>
) {
  if (!project.ictBudgetId) {
    return buildFallbackLineItems(project)
  }

  const resolved = lineItemsByBudgetId.get(project.ictBudgetId) ?? []
  if (!resolved.length) {
    return buildFallbackLineItems(project)
  }

  return resolved.map((item) => {
    const glLabel = item.accountName?.trim() || item.fusionCode?.trim() || item.ebsCode?.trim() || '-'
    return {
      key: makeLeafKey(item.l1 || '-', item.l2 || '-', item.l3 || '-', glLabel),
      glLabel,
      l1: item.l1 || '-',
      l2: item.l2 || '-',
      l3: item.l3 || '-',
      requestedBudget: item.budgetRequested,
    } satisfies ExportLineItem
  })
}

async function resolveLineItems(projects: Project[]) {
  const budgetIds = Array.from(
    new Set(
      projects
        .map((project) => project.ictBudgetId?.trim())
        .filter((value): value is string => Boolean(value))
    )
  )

  const resolvedItems = budgetIds.length > 0 ? await getBudgetLineItemsByBudgetIds(budgetIds) : []
  const lineItemsByBudgetId = new Map<string, BudgetLineItemRecord[]>()

  resolvedItems.forEach((item) => {
    if (!item.budgetId) return
    const existing = lineItemsByBudgetId.get(item.budgetId) ?? []
    existing.push(item)
    lineItemsByBudgetId.set(item.budgetId, existing)
  })

  return lineItemsByBudgetId
}

function parseFallbackTechnologyProducts(project: Project) {
  return project.technology.product
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

async function resolveProjectDisplayValues(projects: Project[]) {
  const [workStreams, technologyCompanies] = await Promise.all([
    getWorkStreamOptions(),
    getTechnologyCompanies(),
  ])

  return Promise.all(
    projects.map(async (project) => {
      if (!project.ictBudgetId) {
        return project as ExportProjectRecord
      }

      try {
        const savedDraft = await getIctBudgetDraftById(
          project.ictBudgetId,
          technologyCompanies,
          parseFallbackTechnologyProducts(project)
        )

        const workStream =
          workStreams.find((option) => option.id === savedDraft.formValues.workStreamId)?.name ||
          project.workStream
        const category =
          CATEGORY_OPTIONS.find((option) => option.value === savedDraft.formValues.category)?.label ||
          project.category
        const budgetType =
          BUDGET_ITEM_TYPE_OPTIONS.find(
            (option) => option.value === savedDraft.formValues.budgetItemType
          )?.label || project.budgetType
        const technologyCompany =
          technologyCompanies.find(
            (company) => company.id === savedDraft.formValues.technologyCompanyId
          )?.name || project.technology.company
        const technologyProduct =
          savedDraft.displayTechnologyProducts.length > 0
            ? savedDraft.displayTechnologyProducts.join(', ')
            : project.technology.product

        return {
          ...project,
          category,
          workStream,
          budgetType,
          technology: {
            ...project.technology,
            company: technologyCompany,
            product: technologyProduct,
          },
        } satisfies ExportProjectRecord
      } catch (error) {
        console.error('[projectExportService] Failed to resolve export display values:', {
          projectId: project.id,
          ictBudgetId: project.ictBudgetId,
          error,
        })
        return project as ExportProjectRecord
      }
    })
  )
}

function collectClassificationLeaves(projects: Project[], lineItemsByBudgetId: Map<string, BudgetLineItemRecord[]>) {
  const leafMap = new Map<string, ClassificationLeaf>()

  projects.forEach((project) => {
    const lineItems = buildResolvedLineItems(project, lineItemsByBudgetId)
    lineItems.forEach((item) => {
      if (!leafMap.has(item.key)) {
        leafMap.set(item.key, {
          key: item.key,
          glLabel: item.glLabel,
          l1: item.l1,
          l2: item.l2,
          l3: item.l3,
        })
      }
    })
  })

  return [...leafMap.values()].sort((left, right) => {
    return (
      left.l1.localeCompare(right.l1) ||
      left.l2.localeCompare(right.l2) ||
      left.l3.localeCompare(right.l3) ||
      left.glLabel.localeCompare(right.glLabel)
    )
  })
}

function getHeaderFill(level: 'basic' | 'l1' | 'l2' | 'l3' | 'leaf') {
  if (level === 'basic') return COLORS.primaryDark
  if (level === 'l1') return COLORS.primary
  if (level === 'l2') return COLORS.primaryMid
  if (level === 'l3') return COLORS.primaryLight
  return COLORS.primaryPale
}

function getHeaderFontColor(level: 'basic' | 'l1' | 'l2' | 'l3' | 'leaf') {
  return level === 'l3' || level === 'leaf' ? COLORS.text : COLORS.white
}

function getHeaderBorderColor() {
  return COLORS.primaryPale
}

function styleHeaderRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startColumn: number,
  endRow: number,
  endColumn: number,
  level: 'basic' | 'l1' | 'l2' | 'l3' | 'leaf',
  value: string
) {
  if (startRow !== endRow || startColumn !== endColumn) {
    sheet.mergeCells(startRow, startColumn, endRow, endColumn)
  }

  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    for (let columnNumber = startColumn; columnNumber <= endColumn; columnNumber += 1) {
      const cell = sheet.getCell(rowNumber, columnNumber)
      cell.font = { bold: true, color: { argb: getHeaderFontColor(level) }, size: level === 'leaf' ? 10 : 11 }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: getHeaderFill(level) },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: getHeaderBorderColor() } },
        left: { style: 'thin', color: { argb: getHeaderBorderColor() } },
        bottom: { style: 'thin', color: { argb: getHeaderBorderColor() } },
        right: { style: 'thin', color: { argb: getHeaderBorderColor() } },
      }
    }
  }

  sheet.getCell(startRow, startColumn).value = value
}

function reinforceMergedHeaderBorders(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startColumn: number,
  endRow: number,
  endColumn: number
) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    for (let columnNumber = startColumn; columnNumber <= endColumn; columnNumber += 1) {
      const cell = sheet.getCell(rowNumber, columnNumber)
      cell.border = {
        top: {
          style: rowNumber === startRow ? 'medium' : 'thin',
          color: { argb: getHeaderBorderColor() },
        },
        left: {
          style: columnNumber === startColumn ? 'medium' : 'thin',
          color: { argb: getHeaderBorderColor() },
        },
        bottom: {
          style: rowNumber === endRow ? 'medium' : 'thin',
          color: { argb: getHeaderBorderColor() },
        },
        right: {
          style: columnNumber === endColumn ? 'medium' : 'thin',
          color: { argb: getHeaderBorderColor() },
        },
      }
    }
  }
}

function applyBodyRow(row: ExcelJS.Row, isAltRow: boolean) {
  row.eachCell((cell) => {
    cell.font = { color: { argb: COLORS.text }, size: 10 }
    cell.alignment = { vertical: 'top', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.border } },
      left: { style: 'thin', color: { argb: COLORS.border } },
      bottom: { style: 'thin', color: { argb: COLORS.border } },
      right: { style: 'thin', color: { argb: COLORS.border } },
    }
    if (isAltRow) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.altRow },
      }
    }
  })
}

function setColumnWidths(sheet: ExcelJS.Worksheet, leaves: ClassificationLeaf[]) {
  const columns = [
    ...BASIC_COLUMNS.map((column) => ({ width: column.width })),
    ...leaves.map((leaf) => ({
      width: Math.min(Math.max(leaf.glLabel.length + 4, 16), 26),
    })),
  ]
  sheet.columns = columns
}

function estimateRowHeight(row: ExcelJS.Row, maxColumn: number) {
  let maxLines = 1

  for (let columnIndex = 1; columnIndex <= maxColumn; columnIndex += 1) {
    const cell = row.getCell(columnIndex)
    const rawValue = cell.value
    const text =
      typeof rawValue === 'object' && rawValue !== null && 'formula' in rawValue
        ? String(cell.result ?? '')
        : String(rawValue ?? '')

    if (!text) continue

    const columnWidth = row.worksheet.getColumn(columnIndex).width ?? 14
    const isLeafHeaderRow = row.number === 4
    const effectiveWidth = isLeafHeaderRow ? Math.max(columnWidth - 5, 7) : Math.max(columnWidth - 2, 8)
    const estimatedLines = text
      .split('\n')
      .reduce(
        (largest, part) =>
          Math.max(largest, Math.ceil(Math.max(part.length, 1) / effectiveWidth)),
        1
      )

    maxLines = Math.max(maxLines, estimatedLines)
  }

  const minimumHeight = row.number <= 4 ? 34 : 28
  const lineHeight = row.number <= 4 ? 18 : 16
  row.height = Math.max(minimumHeight, maxLines * lineHeight + 6)
}

function buildGroupedHeaders(sheet: ExcelJS.Worksheet, leaves: ClassificationLeaf[]) {
  const basicColumnCount = BASIC_COLUMNS.length
  const headerRowCount = 4

  BASIC_COLUMNS.forEach((column, index) => {
    const columnNumber = index + 1
    styleHeaderRange(sheet, 1, columnNumber, headerRowCount, columnNumber, 'basic', column.header)
    reinforceMergedHeaderBorders(sheet, 1, columnNumber, headerRowCount, columnNumber)
  })

  let columnPointer = basicColumnCount + 1
  let leafIndex = 0

  while (leafIndex < leaves.length) {
    const l1 = leaves[leafIndex].l1
    const l1Start = columnPointer
    while (leafIndex < leaves.length && leaves[leafIndex].l1 === l1) {
      const l2 = leaves[leafIndex].l2
      const l2Start = columnPointer

      while (
        leafIndex < leaves.length &&
        leaves[leafIndex].l1 === l1 &&
        leaves[leafIndex].l2 === l2
      ) {
        const l3 = leaves[leafIndex].l3
        const l3Start = columnPointer

        while (
          leafIndex < leaves.length &&
          leaves[leafIndex].l1 === l1 &&
          leaves[leafIndex].l2 === l2 &&
          leaves[leafIndex].l3 === l3
        ) {
          const leaf = leaves[leafIndex]
          styleHeaderRange(sheet, 4, columnPointer, 4, columnPointer, 'leaf', leaf.glLabel)
          columnPointer += 1
          leafIndex += 1
        }

        const l3End = columnPointer - 1
        styleHeaderRange(sheet, 3, l3Start, 3, l3End, 'l3', l3)
      }

      const l2End = columnPointer - 1
      styleHeaderRange(sheet, 2, l2Start, 2, l2End, 'l2', l2)
    }

    const l1End = columnPointer - 1
    styleHeaderRange(sheet, 1, l1Start, 1, l1End, 'l1', l1)
  }

  estimateRowHeight(sheet.getRow(1), basicColumnCount + leaves.length)
  estimateRowHeight(sheet.getRow(2), basicColumnCount + leaves.length)
  estimateRowHeight(sheet.getRow(3), basicColumnCount + leaves.length)
  estimateRowHeight(sheet.getRow(4), basicColumnCount + leaves.length)
}

export async function exportProjectsToExcel(projects: Project[], roleLabel: string) {
  if (projects.length === 0) {
    throw new Error('There are no projects to export for the current filters.')
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ICT Budgeting App'
  workbook.company = 'Department of Government Enablement'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.subject = `${roleLabel} project export`
  workbook.title = `${roleLabel} Projects`

  const [resolvedProjects, lineItemsByBudgetId] = await Promise.all([
    resolveProjectDisplayValues(projects),
    resolveLineItems(projects),
  ])
  const leaves = collectClassificationLeaves(resolvedProjects, lineItemsByBudgetId)

  if (leaves.length === 0) {
    throw new Error('No budget line items were found to export.')
  }

  const sheet = workbook.addWorksheet('Projects', {
    views: [{ state: 'frozen', ySplit: 4 }],
  })

  setColumnWidths(sheet, leaves)
  buildGroupedHeaders(sheet, leaves)

  let rowNumber = 5
  resolvedProjects.forEach((project, index) => {
    const lineItems = buildResolvedLineItems(project, lineItemsByBudgetId)
    const requestedByLeaf = new Map<string, number>()

    lineItems.forEach((item) => {
      requestedByLeaf.set(item.key, (requestedByLeaf.get(item.key) ?? 0) + item.requestedBudget)
    })

    const row = sheet.getRow(rowNumber)
    BASIC_COLUMNS.forEach((column, columnIndex) => {
      const cell = row.getCell(columnIndex + 1)
      const value = column.value(project)
      if (column.type === 'currency' && typeof value === 'number') {
        currencyCell(cell, value)
      } else {
        cell.value = value
      }
    })

    leaves.forEach((leaf, leafIndex) => {
      const cell = row.getCell(BASIC_COLUMNS.length + leafIndex + 1)
      const amount = requestedByLeaf.get(leaf.key)
      if (typeof amount === 'number' && amount > 0) {
        currencyCell(cell, amount)
      } else {
        cell.value = ''
      }
    })

    applyBodyRow(row, index % 2 === 1)
    estimateRowHeight(row, BASIC_COLUMNS.length + leaves.length)
    rowNumber += 1
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const fileName = `${roleLabel.toLowerCase().replace(/\s+/g, '-')}-projects-${formatDateStamp()}.xlsx`
  downloadBuffer(buffer as ArrayBuffer, fileName)
  return fileName
}
