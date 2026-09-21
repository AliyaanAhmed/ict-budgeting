type TranslateResponse = {
  translatedTexts?: string[]
}

const TRANSLATE_ENDPOINT = '/api/translate'

const TEXT_NODE_BLACKLIST = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT'])
const nodeCache = new WeakMap<Text, string>()
const BIDI_CONTROL_REGEX = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

function isPowerAppsHost() {
  const host = window.location.hostname.toLowerCase()
  return host.includes('powerapps.com') || host.includes('powerplatformusercontent.com')
}

function stripBidiControls(value: string) {
  return value.replace(BIDI_CONTROL_REGEX, '')
}

function shouldSkipTextNode(node: Text) {
  const text = node.nodeValue?.trim()
  if (!text) return true
  const parent = node.parentElement
  if (!parent) return true
  if (TEXT_NODE_BLACKLIST.has(parent.tagName)) return true
  if (parent.closest('[data-no-translate="true"]')) return true
  return false
}

function collectTextNodes(root: ParentNode): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) {
    const current = walker.currentNode as Text
    if (!shouldSkipTextNode(current)) nodes.push(current)
  }
  return nodes
}

function getCachedTranslation(input: string) {
  return localStorage.getItem(`tr_en_ar_${input}`)
}

function setCachedTranslation(input: string, output: string) {
  localStorage.setItem(`tr_en_ar_${input}`, output)
}

async function translateBatch(texts: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const unique = Array.from(new Set(texts))

  unique.forEach((t) => {
    const cached = getCachedTranslation(t)
    if (cached) result.set(t, cached)
  })
  const uncached = unique.filter((t) => !getCachedTranslation(t))

  if (uncached.length === 0) return result

  try {
    const response = await fetch(TRANSLATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: uncached,
        source: 'en',
        target: 'ar',
      }),
    })

    if (!response.ok) return result
    const payload = (await response.json()) as TranslateResponse
    const translated = payload.translatedTexts || []

    translated.forEach((output, idx) => {
      const original = uncached[idx]
      if (!original || !output || output === original) return
      const cleaned = stripBidiControls(output)
      result.set(original, cleaned)
      setCachedTranslation(original, cleaned)
    })
  } catch (error) {
    if (isPowerAppsHost()) {
      console.warn('Translation API call failed in Power Apps host. Check Code App CSP connect-src or use a connector-backed translation service.', error)
    }
  }

  return result
}

function applyInputPlaceholderTranslation(map: Map<string, string>, toArabic: boolean) {
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
  inputs.forEach((el) => {
    const placeholder = el.placeholder?.trim()
    if (!placeholder) return
    if (!el.dataset.originalPlaceholder) el.dataset.originalPlaceholder = placeholder
    const original = el.dataset.originalPlaceholder
    if (!original) return
    if (!toArabic) {
      el.placeholder = stripBidiControls(original)
      return
    }
    const translated = map.get(original)
    if (translated) el.placeholder = stripBidiControls(translated)
  })
}

export async function translatePage(toArabic: boolean) {
  const textNodes = collectTextNodes(document.body)

  if (!toArabic) {
    textNodes.forEach((node) => {
      const original = nodeCache.get(node)
      if (original) node.nodeValue = stripBidiControls(original)
    })
    applyInputPlaceholderTranslation(new Map(), false)
    return
  }

  textNodes.forEach((node) => {
    if (!nodeCache.has(node)) nodeCache.set(node, node.nodeValue || '')
  })

  const originals = textNodes
    .map((n) => (nodeCache.get(n) || '').trim())
    .filter(Boolean)

  const placeholders = Array.from(
    new Set(
      Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'))
        .map((el) => {
          const p = el.placeholder?.trim()
          if (!p) return null
          if (!el.dataset.originalPlaceholder) el.dataset.originalPlaceholder = p
          return el.dataset.originalPlaceholder
        })
        .filter((v): v is string => Boolean(v))
    )
  )

  const map = await translateBatch([...originals, ...placeholders])

  textNodes.forEach((node) => {
    const original = (nodeCache.get(node) || '').trim()
    const translated = map.get(original)
    if (translated) node.nodeValue = stripBidiControls(node.nodeValue?.replace(original, translated) || translated)
  })

  applyInputPlaceholderTranslation(map, true)
}
