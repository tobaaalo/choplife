// Runs in GitHub Actions before deploying. Creates the Cloudflare database and
// website project on the first run, and fills the database id into the config.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const run = (args, opts = {}) =>
  execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  })

const find = () => JSON.parse(run(['d1', 'list', '--json'])).find((d) => d.name === 'choplife')

let db = find()
if (!db) {
  console.log('Creating database choplife')
  run(['d1', 'create', 'choplife'])
  db = find()
}
if (!db) throw new Error('Could not find or create the choplife database')
const id = db.uuid ?? db.database_id ?? db.id
for (const f of ['wrangler.toml', 'workers/wrangler.toml']) {
  writeFileSync(f, readFileSync(f, 'utf8').replace('REPLACE_WITH_YOUR_D1_ID', id))
}
console.log('Database id', id)

try {
  run(['pages', 'project', 'create', 'choplife', '--production-branch', 'main'])
  console.log('Created Pages project choplife')
} catch (e) {
  const msg = String(e.stderr ?? e.message)
  if (!/already exists|8000002/i.test(msg)) throw e
  console.log('Pages project already exists')
}
