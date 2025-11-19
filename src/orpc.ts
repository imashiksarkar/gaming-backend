import { IContext } from '@/app'
import { os } from '@orpc/server'
import { m } from 'node_modules/@orpc/server/dist/shared/server.B4BGqy3Y.mjs'
import * as z from 'zod'

class Planet {
  static readonly list = os
    .$context<IContext>()
    .$route({
      summary: 'list all planets',
      method: 'GET',
      path: '/',
    })
    .handler(async ({ context }) => {
      const authError = context.requireAuth()
      if (authError) return authError

      const r = context
        .exres()
        .success(200)
        .data([{ id: 1, name: 'name' }])
        .message('success')
        .exec()

      return r
    })

  static readonly find = os
    .$context<IContext>()
    .$route({
      summary: 'find a planet',
      path: '/{planetId}/{planetName}',
      method: 'GET',
    })
    .input(
      z.object({
        planetId: z.coerce.number().min(1),
        planetName: z.string(),
      })
    )
    .output(
      z.object({ id: z.number().describe('planet id'), name: z.string() })
    )
    .handler(async ({ input }) => {
      return { id: input.planetId, name: 'name' }
    })

  static readonly create = os
    .$context<IContext>()
    .$route({
      summary: 'create a planet',
    })
    .input(
      z.object({
        name: z.string().nonempty().default('mercury').describe('planet name'),
      })
    )
    .output(z.object({ id: z.number(), name: z.string() }))
    .handler(async ({ input }) => {
      const data = {
        id: 10,
        name: input.name,
      }

      return data
    })
}

export const router = os.prefix('/planets').router({
  planet: Object.create(Planet),
})
