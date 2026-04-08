import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`)
}

export function read(collection) {
  const filePath = getFilePath(collection)
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

export function write(collection, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2))
}

export function findById(collection, id) {
  return read(collection).find((item) => item.id === id) || null
}

export function insert(collection, item) {
  const data = read(collection)
  data.push(item)
  write(collection, data)
  return item
}

export function update(collection, id, updates) {
  const data = read(collection)
  const index = data.findIndex((item) => item.id === id)
  if (index === -1) return null
  data[index] = { ...data[index], ...updates }
  write(collection, data)
  return data[index]
}

export function remove(collection, id) {
  const data = read(collection)
  const filtered = data.filter((item) => item.id !== id)
  write(collection, filtered)
  return filtered.length < data.length
}
