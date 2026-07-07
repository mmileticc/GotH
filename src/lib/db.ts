import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface GothDB extends DBSchema {
  kv: {
    key: string
    value: unknown
  }
}

let dbPromise: Promise<IDBPDatabase<GothDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<GothDB>('goth-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv')
        }
      },
    })
  }
  return dbPromise
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await getDb()
  return (await db.get('kv', key)) as T | undefined
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await getDb()
  await db.put('kv', value, key)
}

export async function idbDelete(key: string): Promise<void> {
  const db = await getDb()
  await db.delete('kv', key)
}
