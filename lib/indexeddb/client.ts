import { openDB as idbOpenDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'mochi-timer'
const DB_VERSION = 1

export interface LocalSession {
  id: string
  startTime: string
  endTime?: string
  duration?: number
  notes?: string
  synced: boolean
}

interface MochiTimerDB {
  sessions: {
    key: string
    value: LocalSession
  }
  activeSession: {
    key: 'current'
    value: LocalSession
  }
}

let db: IDBPDatabase<MochiTimerDB> | null = null

export async function openDB(): Promise<IDBPDatabase<MochiTimerDB>> {
  if (db) return db
  db = await idbOpenDB<MochiTimerDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('sessions')) {
        database.createObjectStore('sessions', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('activeSession')) {
        database.createObjectStore('activeSession')
      }
    },
  })
  return db
}

export async function saveActiveSession(session: LocalSession): Promise<void> {
  const database = await openDB()
  await database.put('activeSession', session, 'current')
}

export async function getActiveSession(): Promise<LocalSession | undefined> {
  const database = await openDB()
  return database.get('activeSession', 'current')
}

export async function clearActiveSession(): Promise<void> {
  const database = await openDB()
  await database.delete('activeSession', 'current')
}

export async function saveSession(session: LocalSession): Promise<void> {
  const database = await openDB()
  await database.put('sessions', session)
}

export async function getUnsyncedSessions(): Promise<LocalSession[]> {
  const database = await openDB()
  const all = await database.getAll('sessions')
  return all.filter((s) => !s.synced)
}

export async function markSessionSynced(id: string): Promise<void> {
  const database = await openDB()
  const session = await database.get('sessions', id)
  if (session) {
    await database.put('sessions', { ...session, synced: true })
  }
}
