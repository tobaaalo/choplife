// Prints a VAPID key pair for Web Push. Run: node scripts/vapid.mjs
import { webcrypto } from 'node:crypto'

const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
  'sign',
])
const jwk = await webcrypto.subtle.exportKey('jwk', pair.privateKey)
const b64 = (s) => s.replace(/=+$/, '')
const pub = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(jwk.x, 'base64url'),
  Buffer.from(jwk.y, 'base64url'),
])
console.log('VAPID_PUBLIC_KEY=' + b64(pub.toString('base64url')))
console.log('VAPID_PRIVATE_KEY=' + b64(jwk.d))
