import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('../.power/schemas/appschemas/dataSourcesInfo.ts', import.meta.url)
const source = readFileSync(path, 'utf8')
const start = source.indexOf('{')
const end = source.lastIndexOf('}')
const sources = JSON.parse(source.slice(start, end + 1))
const manual = JSON.parse(readFileSync(new URL('./manual-data-sources.json', import.meta.url), 'utf8'))
let changed = false
for (const [key, value] of Object.entries(manual)) {
  if (!sources[key]) {
    sources[key] = value
    changed = true
    console.log(`Restored manual data source: ${key}`)
  }
}
if (changed) writeFileSync(path, source.slice(0, start) + JSON.stringify(sources, null, 2) + source.slice(end + 1))
