/** The small slice of Cloudflare D1 the app uses, so a Node adapter can stand in for tests and local runs. */
export interface D1Prepared {
  bind(...values: unknown[]): D1Prepared
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<{ results: T[] }>
  run(): Promise<unknown>
}

export interface D1Like {
  prepare(sql: string): D1Prepared
  batch(statements: D1Prepared[]): Promise<unknown[]>
}

export interface Mail {
  to: string
  subject: string
  text: string
}

export interface Env {
  DB: D1Like
  APP_URL?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  VAPID_PUBLIC_KEY?: string
  /** Replaces the email service in tests and local runs. */
  mailer?: (mail: Mail) => Promise<void>
  /** Lower for fast tests. Defaults to 100000, the most Workers allow. */
  PBKDF2_ITERATIONS?: string
}

export class HttpError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
