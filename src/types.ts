import * as z from 'zod'

export const apiKeySchema = z.string().min(1)

export const postSensorValueSchema = z.boolean().optional()

export const configSchema = z.object({
  gatewayUrl: z.string().min(1).optional(),
  gatewayApiKey: z.string().min(1).optional(),
  sensors: z.array(
    z.object({
      name: z.string(),
      type: z.literal('CLIPGenericFlag'),
    })
  ),
})

export type Config = z.infer<typeof configSchema>

const baseSensorSchema = z.object({
  name: z.string().min(1),
  swversion: z.string().min(1),
  manufacturername: z.string().min(1),
  modelid: z.string().min(1),
  uniqueid: z.string().min(1),
})

export const createSensorSchema = baseSensorSchema.merge(
  z.object({
    type: z.union([
      z.enum(['CLIPGenericFlag', 'CLIPGenericStatus']),
      z.string().min(1),
    ]),
  })
)

const baseSensorStateSchema = z.object({
  lastupdated: z.string().min(1),
})

const genericFlagStateSchema = baseSensorStateSchema.merge(
  z.object({
    flag: z.boolean(),
  })
)

export type GenericFlagState = z.infer<typeof genericFlagStateSchema>
export type GenericStatusState = z.infer<typeof genericStatusStateSchema>

const genericStatusStateSchema = baseSensorStateSchema.merge(
  z.object({
    status: z.number(),
  })
)

export const clipGenericFlagSchema = baseSensorSchema.merge(
  z.object({
    type: z.literal('CLIPGenericFlag'),
    state: genericFlagStateSchema,
  })
)

export const clipGenericStatusSchema = baseSensorSchema.merge(
  z.object({
    type: z.literal('CLIPGenericStatus'),
    state: genericStatusStateSchema,
  })
)

export const getSensorSchema = z.union([
  z.discriminatedUnion('type', [
    clipGenericFlagSchema,
    clipGenericStatusSchema,
  ]),
  baseSensorSchema.merge(
    z.object({
      type: z.string().min(1),
    })
  ),
])

export type Sensor = z.infer<typeof getSensorSchema>

export const sensorsResponseSchema = z.record(
  z.string().min(1),
  getSensorSchema
)

export const deconzConfigSchema = z.object({
  websocketnotifyall: z.boolean(),
  websocketport: z.number(),
})

export type DeconzConfig = z.infer<typeof deconzConfigSchema>
