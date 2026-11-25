import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { assignIds, isExcluded, isStructureName, layerFor, parseName, parseTranslations, toStructure } from './names.ts'
import { LAYER_IDS, type Structure } from '../../src/types.ts'

interface Item { name: string; type: string; collections: string[]; triangles: number }

const inventory: Item[] = JSON.parse(readFileSync('.cache/inventory.json', 'utf8'))
const translations = parseTranslations(readFileSync('.cache/Translations0.txt', 'utf8'))
const excluded: string[] = []
const found: Structure[] = []

for (const item of inventory) {
  if (!['MESH', 'CURVE'].includes(item.type) || item.triangles === 0 || !isStructureName(item.name)) continue
  const layer = layerFor(item.collections, item.name)
  if (!layer) continue
  if (isExcluded(item.name, item.collections)) excluded.push(item.name)
  else found.push(toStructure(item, layer, translations))
}

const structures = assignIds(found.sort((a, b) => a.sourceName.localeCompare(b.sourceName, 'en')))
mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/structures.json', JSON.stringify(structures))
writeFileSync('.cache/export-list.json', JSON.stringify(structures.map(({ id, sourceName, layer }) => ({ id, sourceName, layer }))))

for (const layer of LAYER_IDS) console.log(layer, structures.filter(s => s.layer === layer).length)
console.log('total', structures.length)
console.log('excluded', excluded.sort())
const untranslated = structures.filter(s => !s.translated)
console.log('untranslated', untranslated.length, [...new Set(untranslated.map(s => parseName(s.sourceName).base))])
// spellings usual in European Portuguese but not in Brazilian Portuguese
const european = /\b(fa[sc]cia lata|face?to|artelho|registo|equipa|ténia|fémur|tíbi[ao] pós|adbutor)\b|[éó](?=[mn][aeiou])|cção|ct[oa]\b/i
const flagged = [...new Set(structures.filter(s => s.translated && european.test(s.namePt)).map(s => s.namePt))]
console.log('possibly European Portuguese', flagged.length, flagged.slice(0, 40))
