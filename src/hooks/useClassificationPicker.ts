import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import type {
  BudgetItemDraft,
  ClassificationNode,
  ClassificationSearchResult,
} from '@/domain/classification'
import {
  buildBudgetItemDraft,
  buildClassificationTree,
  getClassificationRecords,
  searchClassificationBudgetAccounts,
} from '@/services/classificationService'

interface UseClassificationPickerOptions {
  open: boolean
  existingIds: string[]
}

export function useClassificationPicker({ open, existingIds }: UseClassificationPickerOptions) {
  const [records, setRecords] = useState<ClassificationNode[]>([])
  const [flatRecords, setFlatRecords] = useState<BudgetItemDraft[]>([])
  const [selectedLevelIds, setSelectedLevelIds] = useState<{ l1Id: string | null; l2Id: string | null; l3Id: string | null }>({
    l1Id: null,
    l2Id: null,
    l3Id: null,
  })
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugLines, setDebugLines] = useState<string[]>([])

  const addDebugLine = (message: string) => {
    const line = `${new Date().toLocaleTimeString()} - ${message}`
    console.debug('[classification-picker]', line)
    setDebugLines((current) => [...current, line].slice(-12))
  }

  useEffect(() => {
    if (!open) return

    let mounted = true

    const load = async () => {
      addDebugLine('Modal opened. Starting classification load.')
      setLoading(true)
      setError(null)

      try {
        const items = await getClassificationRecords()
        if (!mounted) return
        addDebugLine(`Classification records loaded: ${items.length}`)
        const tree = buildClassificationTree(items)
        setRecords(tree.roots)
        setFlatRecords(
          items
            .filter((item) => item.level === 4)
            .map((item) => buildBudgetItemDraft(item.id, tree.nodeMap))
            .filter((item): item is BudgetItemDraft => item !== null)
        )
      } catch (loadError) {
        if (!mounted) return
        const message = loadError instanceof Error ? loadError.message : 'Unable to load classifications.'
        addDebugLine(`Load failed: ${message}`)
        setError(message)
      } finally {
        if (mounted) {
          addDebugLine('Classification load finished.')
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setSelectedLevelIds({ l1Id: null, l2Id: null, l3Id: null })
      setSelectedAccountIds([])
      setSearchTerm('')
      setError(null)
      setDebugLines([])
    }
  }, [open])

  const existingIdSet = useMemo(() => new Set(existingIds), [existingIds])
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const nodeMap = useMemo(() => {
    const map = new Map<string, ClassificationNode>()
    const walk = (items: ClassificationNode[]) => {
      items.forEach((item) => {
        map.set(item.id, item)
        walk(item.children)
      })
    }
    walk(records)
    return map
  }, [records])

  const level1Items = records
  const level2Items = selectedLevelIds.l1Id ? nodeMap.get(selectedLevelIds.l1Id)?.children ?? [] : []
  const level3Items = selectedLevelIds.l2Id ? nodeMap.get(selectedLevelIds.l2Id)?.children ?? [] : []
  const budgetAccountItems = selectedLevelIds.l3Id ? nodeMap.get(selectedLevelIds.l3Id)?.children ?? [] : []

  const searchResults = useMemo<ClassificationSearchResult[]>(
    () => searchClassificationBudgetAccounts(
      [...nodeMap.values()],
      nodeMap,
      deferredSearchTerm
    ),
    [deferredSearchTerm, nodeMap]
  )

  const pendingItems = useMemo(
    () =>
      selectedAccountIds
        .map((id) => buildBudgetItemDraft(id, nodeMap))
        .filter((item): item is BudgetItemDraft => item !== null),
    [nodeMap, selectedAccountIds]
  )

  const duplicatePendingIds = useMemo(
    () => pendingItems.filter((item) => existingIdSet.has(item.id)).map((item) => item.id),
    [existingIdSet, pendingItems]
  )

  const duplicateSearchMatches = duplicatePendingIds.length > 0

  const selectLevel = (level: 1 | 2 | 3, id: string) => {
    if (level === 1) {
      setSelectedLevelIds({ l1Id: id, l2Id: null, l3Id: null })
      return
    }

    if (level === 2) {
      setSelectedLevelIds((current) => ({ ...current, l2Id: id, l3Id: null }))
      return
    }

    setSelectedLevelIds((current) => ({ ...current, l3Id: id }))
  }

  const toggleBudgetAccount = (id: string) => {
    if (existingIdSet.has(id)) {
      setError('This budget account is already in the project grid.')
      return
    }

    setError(null)
    setSelectedAccountIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    )
  }

  const removePending = (id: string) => {
    setSelectedAccountIds((current) => current.filter((itemId) => itemId !== id))
  }

  const applySearchResult = (result: ClassificationSearchResult) => {
    setSelectedLevelIds({
      l1Id: result.pathIds.l1Id,
      l2Id: result.pathIds.l2Id,
      l3Id: result.pathIds.l3Id,
    })
    toggleBudgetAccount(result.pathIds.glId)
  }

  return {
    loading,
    error,
    searchTerm,
    setSearchTerm,
    level1Items,
    level2Items,
    level3Items,
    budgetAccountItems,
    searchResults,
    pendingItems,
    duplicateSearchMatches,
    selectedLevelIds,
    selectedAccountIds,
    selectLevel,
    toggleBudgetAccount,
    removePending,
    applySearchResult,
    availableBudgetAccountCount: flatRecords.length,
    debugLines,
  }
}
