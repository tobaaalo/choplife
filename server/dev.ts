import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { handle } from './handler'
import { createNodeD1 } from './node-d1'
import type { Env, Mail } from './types'

const port = Number(process.env.PORT ?? 4173)
const dist = join(process.cwd(), 'dist')
const outbox: Mail[] = []
const env: Env = {
  DB: createNodeD1(process.env.DB_PATH ?? ':memory:'),
  PBKDF2_ITERATIONS: process.env.PBKDF2_ITERATIONS ?? '1000',
  mailer: async (m) => {
    outbox.push(m)
  },
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`)
  if (url.pathname === '/__outbox') {
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(outbox))
    return
  }
  if (url.pathname.startsWith('/api/')) {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
    const body = chunks.length ? Buffer.concat(chunks) : undefined
    const r = await handle(
      new Request(url, {
        method: req.method,
        headers,
        body: req.method === 'GET' ? undefined : body,
      }),
      env,
    )
    const out = new Headers(r.headers)
    res.writeHead(r.status, Object.fromEntries(out.entries()))
    res.end(Buffer.from(await r.arrayBuffer()))
    return
  }
  let file = join(dist, normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''))
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(404)
    res.end('Run npm run build first')
    return
  }
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
}).listen(port, () => console.log(`Choplife dev server on http://localhost:${port}`))
