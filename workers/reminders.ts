import { buildPushPayload } from '@block65/webcrypto-web-push'
import type { D1Like } from '../server/types'
import { runReminders } from './core'
import type { Sender } from './core'

interface Env {
  DB: D1Like
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

export default {
  async scheduled(_event: unknown, env: Env): Promise<void> {
    const send: Sender = async (sub, note) => {
      try {
        const payload = await buildPushPayload(
          { data: JSON.stringify(note), options: { ttl: 3600 } },
          { endpoint: sub.endpoint, expirationTime: null, keys: sub.data },
          {
            subject: env.VAPID_SUBJECT,
            publicKey: env.VAPID_PUBLIC_KEY,
            privateKey: env.VAPID_PRIVATE_KEY,
          },
        )
        const res = await fetch(sub.endpoint, payload)
        return res.status
      } catch {
        return 0
      }
    }
    await runReminders(env.DB, new Date(), send)
  },
}
