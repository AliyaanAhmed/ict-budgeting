import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function translationApiPlugin(): Plugin {
  return {
    name: 'local-translation-api',
    configureServer(server) {
      server.middlewares.use('/api/translate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk.toString()
        })

        req.on('end', async () => {
          try {
            const body = JSON.parse(raw || '{}') as { q?: string[] | string; source?: string; target?: string }
            const source = body.source || 'en'
            const target = body.target || 'ar'
            const texts = Array.isArray(body.q) ? body.q : body.q ? [body.q] : []

            const translateOne = async (text: string) => {
              try {
                const url = new URL('https://translate.googleapis.com/translate_a/single')
                url.searchParams.set('client', 'gtx')
                url.searchParams.set('sl', source)
                url.searchParams.set('tl', target)
                url.searchParams.set('dt', 't')
                url.searchParams.set('q', text)

                const resp = await fetch(url.toString())
                if (!resp.ok) return text
                const data = (await resp.json()) as unknown[]
                const translated = Array.isArray(data?.[0])
                  ? (data[0] as unknown[])
                      .map((chunk) => (Array.isArray(chunk) ? String(chunk[0] ?? '') : ''))
                      .join('')
                      .trim()
                  : ''
                return translated || text
              } catch {
                return text
              }
            }

            const output = await Promise.all(texts.map((t) => translateOne(t)))

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ translatedTexts: output }))
          } catch {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ translatedTexts: [] }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), translationApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
