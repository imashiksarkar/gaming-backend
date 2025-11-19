import { exres } from '@/libs'
import modules from '@/modules'
import { router } from '@/orpc'
import { OpenAPIGenerator } from '@orpc/openapi'
import { OpenAPIHandler } from '@orpc/openapi/node'
import { onError } from '@orpc/server'
import { CORSPlugin } from '@orpc/server/plugins'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'

function requireAuth() {
  // @ts-ignore
  const context = this as IContext

  if (context.req.hostname === 'localhost') return

  return {
    success: true,
    data: {
      haha: 'hehe',
    },
  }
}

export type IContext = {
  req: Request
  res: Response
  exres: typeof exres
  requireAuth: typeof requireAuth
}

export default async () => {
  const app = express()

  app.use(express.json())

  const handler = new OpenAPIHandler(router, {
    plugins: [new CORSPlugin()],
    interceptors: [
      onError((error) => console.log(JSON.stringify(error, null, 2))),
    ],
  })

  const openAPIGenerator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  })

  app.use(
    '/rpc{/*path}',
    async (req: Request, res: Response, next: NextFunction) => {
      const context = { exres, req, res, requireAuth }

      const { matched } = await handler.handle(req, res, {
        prefix: '/rpc',
        context,
      })

      if (matched) return

      next()
    }
  )

  app.use('/docs/spec.json', async (_req: Request, res: Response) => {
    const spec = await openAPIGenerator.generate(router, {
      info: {
        title: 'My Playground',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:5000/rpc' }],
    })

    res.status(200).json(spec)
  })

  app.use('/docs', async (_req: Request, res: Response) => {
    const html = `
    <!doctype html>
    <html>
      <head>
        <title>My Client</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="https://orpc.unnoq.com/icon.svg" />
      </head>
      <body>
        <div id="app"></div>

        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app', {
            url: '/docs/spec.json'
          })
        </script>
      </body>
    </html>
  `

    res.writeHead(200, { 'Content-Type': 'text/html' }).end(html)
  })

  app.get('/', (_req: Request, res: Response) => {
    const r = exres().success(200).message('App is running fine 🚀').exec()
    res.status(r.code).json(r)
  })

  app.get('/health', (_req: Request, res: Response) => {
    const r = exres()
      .success(200)
      .message('App is running fine 🚀')
      .data({
        uptime: process.uptime(),
      })
      .exec()
    res.status(r.code).json(r)
  })

  app.use(modules)

  return app
}
