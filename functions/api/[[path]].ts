import { handle } from '../../server/handler'
import type { Env } from '../../server/types'

export const onRequest = (context: { request: Request; env: Env }): Promise<Response> =>
  handle(context.request, context.env)
