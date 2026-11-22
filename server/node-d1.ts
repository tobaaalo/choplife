import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { D1Like, D1Prepared } from './types'

type SqlValue = string | number | bigint | null

/** A D1-shaped wrapper over node:sqlite, used by tests and the local dev server. */
export function createNodeD1(
  path = ':memory:',
  migrationsDir = join(process.cwd(), 'migrations'),
): D1Like {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = OFF;')
  db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)')
  const done = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map((r) => r.name),
  )
  for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    if (done.has(file)) continue
    db.exec(readFileSync(join(migrationsDir, file), 'utf8'))
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file)
  }

  const make = (sql: string, values: SqlValue[] = []): D1Prepared & { exec(): void } => ({
    bind: (...v: unknown[]) => make(sql, v as SqlValue[]),
    first: async <T>() => (db.prepare(sql).get(...values) as T | undefined) ?? null,
    all: async <T>() => ({ results: db.prepare(sql).all(...values) as T[] }),
    run: async () => {
      db.prepare(sql).run(...values)
      return {}
    },
    exec: () => {
      db.prepare(sql).run(...values)
    },
  })

  return {
    prepare: (sql) => make(sql),
    batch: async (stmts) => {
      db.exec('BEGIN')
      try {
        for (const s of stmts) (s as ReturnType<typeof make>).exec()
        db.exec('COMMIT')
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
      return stmts.map(() => ({}))
    },
  }
}
