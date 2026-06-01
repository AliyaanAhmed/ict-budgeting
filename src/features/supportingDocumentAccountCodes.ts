import type { BudgetItemDraft, ClassificationNode } from '@/domain/classification'
import { buildBudgetItemDraft } from '@/services/classificationService'
import type {
  SupportingDocumentAccountCodeSuggestion,
  SupportingDocumentBudgetLine,
  SupportingDocumentEvaluationSummary,
} from '@/services/aiSupportingDocumentEvaluationService'

export interface ComputedSupportingDocumentAccountCodeSuggestion {
  rawAccountLabel: string
  accountCode: string
  accountName: string
  displayLabel: string
  expenseType: string
  classificationPath: SupportingDocumentAccountCodeSuggestion['classification_path']
  mappedLineNumbers: number[]
  mappedBudget: number
  confidence: number | null
  reason: string
  requestedBudget: number | null
}

function parseAccountCodeLabel(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^(.*?)(?:\s*-\s*(GL\d+))$/i)

  if (!match) {
    return {
      accountCode: trimmed,
      accountName: trimmed,
      displayLabel: trimmed,
    }
  }

  const accountName = match[1].trim()
  const accountCode = match[2].trim().toUpperCase()

  return {
    accountCode,
    accountName,
    displayLabel: accountName ? `${accountName} (${accountCode})` : accountCode,
  }
}

function buildBudgetLineAmountMap(lines: SupportingDocumentBudgetLine[]) {
  return new Map(
    lines
      .filter(
        (line): line is SupportingDocumentBudgetLine & { line_number: number; amount: number } =>
          typeof line.line_number === 'number' && typeof line.amount === 'number'
      )
      .map((line) => [line.line_number, line.amount])
  )
}

export function getComputedSupportingDocumentAccountCodeSuggestions(
  summary: SupportingDocumentEvaluationSummary | Record<string, unknown> | null | undefined
) {
  if (!summary || typeof summary !== 'object') return []

  const accountCodeSuggestions = Array.isArray(summary.account_code_suggestions)
    ? (summary.account_code_suggestions as SupportingDocumentAccountCodeSuggestion[])
    : []
  const budgetLines = Array.isArray(summary.budget_lines)
    ? (summary.budget_lines as SupportingDocumentBudgetLine[])
    : []
  const budgetLineAmounts = buildBudgetLineAmountMap(budgetLines)

  return accountCodeSuggestions
    .map<ComputedSupportingDocumentAccountCodeSuggestion | null>((suggestion) => {
      const rawAccountLabel = String(suggestion.account_code ?? '').trim()
      if (!rawAccountLabel) return null

      const mappedLineNumbers = Array.isArray(suggestion.mapped_budget_line_numbers)
        ? suggestion.mapped_budget_line_numbers.filter(
            (lineNumber): lineNumber is number => typeof lineNumber === "number"
          )
        : []
      const mappedBudget = mappedLineNumbers.reduce(
        (sum, lineNumber) => sum + (budgetLineAmounts.get(lineNumber) ?? 0),
        0
      )
      const { accountCode, accountName, displayLabel } = parseAccountCodeLabel(rawAccountLabel)

      return {
        rawAccountLabel,
        accountCode,
        accountName,
        displayLabel,
        expenseType: String(suggestion.expense_type ?? '').trim(),
        classificationPath: suggestion.classification_path,
        mappedLineNumbers,
        mappedBudget:
          mappedBudget > 0
            ? mappedBudget
            : typeof suggestion.requested_budget === 'number'
              ? suggestion.requested_budget
              : 0,
        confidence:
          typeof suggestion.account_code_confidence === 'number'
            ? suggestion.account_code_confidence
            : null,
        reason: String(suggestion.reason ?? '').trim(),
        requestedBudget:
          typeof suggestion.requested_budget === 'number' ? suggestion.requested_budget : null,
      }
    })
    .filter(
      (suggestion): suggestion is ComputedSupportingDocumentAccountCodeSuggestion =>
        suggestion !== null
    )
}

export function buildBudgetItemDraftFromSuggestedAccountCode(
  suggestion: ComputedSupportingDocumentAccountCodeSuggestion,
  nodeMap: Map<string, ClassificationNode>
): BudgetItemDraft | null {
  const searchTerms = Array.from(
    new Set(
      [
        suggestion.rawAccountLabel,
        suggestion.accountName,
        suggestion.accountCode,
      ]
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean)
    )
  )

  let matchedId: string | null = null

  for (const [id, node] of nodeMap.entries()) {
    if (node.level !== 4) continue

    const nodeName = (node.name ?? '').toLowerCase()
    const ebsCode = (node.ebsCode ?? '').toLowerCase()
    const fusionCode = (node.fusionCode ?? '').toLowerCase()

    if (
      searchTerms.some(
        (term) =>
          nodeName === term ||
          ebsCode === term ||
          fusionCode === term
      )
    ) {
      matchedId = id
      break
    }
  }

  if (!matchedId) {
    for (const [id, node] of nodeMap.entries()) {
      if (node.level !== 4) continue

      const nodeName = (node.name ?? '').toLowerCase()
      const ebsCode = (node.ebsCode ?? '').toLowerCase()
      const fusionCode = (node.fusionCode ?? '').toLowerCase()

      if (
        searchTerms.some(
          (term) =>
            nodeName.includes(term) ||
            term.includes(nodeName) ||
            ebsCode === term ||
            fusionCode === term
        )
      ) {
        matchedId = id
        break
      }
    }
  }

  if (!matchedId) {
    const segments = searchTerms.flatMap((term) =>
      term.split(/\s*-\s*/).map((segment) => segment.trim()).filter((segment) => segment.length >= 2)
    )

    for (const segment of segments) {
      if (matchedId) break

      for (const [id, node] of nodeMap.entries()) {
        if (node.level !== 4) continue
        const nodeName = (node.name ?? '').toLowerCase()

        if (nodeName.includes(segment) || segment.includes(nodeName)) {
          matchedId = id
          break
        }
      }
    }
  }

  if (!matchedId) return null

  const draft = buildBudgetItemDraft(matchedId, nodeMap)
  return draft
    ? {
        ...draft,
        budgetRequested: suggestion.mappedBudget,
      }
    : null
}
