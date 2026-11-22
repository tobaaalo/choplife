import type { Env, Mail } from './types'

export function emailConfigured(env: Env): boolean {
  return !!env.mailer || !!env.RESEND_API_KEY
}

/** Sends through the test mailer, or through Resend with plain HTTPS. */
export async function sendEmail(env: Env, mail: Mail): Promise<void> {
  if (env.mailer) return env.mailer(mail)
  if (!env.RESEND_API_KEY) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? 'Choplife <onboarding@resend.dev>',
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  })
  if (!res.ok) console.error('Email failed', res.status)
}
