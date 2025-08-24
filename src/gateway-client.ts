import got from 'got'
import { getConfig as c } from './config'
import {
  clipGenericFlagSchema,
  deconzConfigSchema,
  getSensorSchema,
  sensorsResponseSchema,
} from './types'

export const getConfig = async () => {
  const response = await got.get(
    `${c().gatewayUrl}/api/${c().gatewayApiKey}/config`
  )
  return deconzConfigSchema.parse(JSON.parse(response.body))
}

export const getSensors = async () => {
  const response = await got.get(
    `${c().gatewayUrl}/api/${c().gatewayApiKey}/sensors`
  )
  return sensorsResponseSchema.parse(JSON.parse(response.body))
}

export const createSensor = async ({
  name,
  type,
}: {
  name: string
  type: string
}) => {
  await got.post(`${c().gatewayUrl}/api/${c().gatewayApiKey}/sensors`, {
    body: JSON.stringify({
      name,
      type,
      swversion: '1.0',
      manufacturername: 'hue-proxy',
      modelid: name,
      uniqueid: `hue-proxy::sensor::${name}`,
    }),
  })
}

export const getSensorState = async ({ sensorId }: { sensorId: string }) => {
  const response = await got.get(
    `${c().gatewayUrl}/api/${c().gatewayApiKey}/sensors/${sensorId}`
  )

  const sensor = clipGenericFlagSchema.parse(JSON.parse(response.body))

  return sensor.state.flag
}

export const updateSensorState = async ({
  sensorId,
  value,
}: {
  sensorId: string
  value: boolean // TODO: extend for other sensor types
}) => {
  await got.put(
    `${c().gatewayUrl}/api/${c().gatewayApiKey}/sensors/${sensorId}/state`,
    {
      body: JSON.stringify({
        flag: value.toString(),
      }),
    }
  )
}
