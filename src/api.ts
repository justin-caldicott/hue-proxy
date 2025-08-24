import http from 'http'
import { parse } from 'yaml'
import { getConfig, updateConfig } from './config'
import { apiKeySchema, configSchema, postSensorValueSchema } from './types'
import { getVirtualSensorsByName, invalidateSensors } from './virtual-sensors'
import {
  createSensor,
  getSensorState,
  updateSensorState,
} from './gateway-client'
import { getApiKey } from './api-key'

const host = '0.0.0.0'
const port = 14202
const apiKey = getApiKey()

const getSensorName = ({ name, type }: { name: string; type: string }) =>
  `/${type}/${name}`

const putConfig = async (configYaml: string) => {
  const config = configSchema.pick({ sensors: true }).parse(parse(configYaml))

  invalidateSensors() // Sensors may have changed, e.g. may have removed a virtual sensor to include via hue-proxy

  const virtualSensorsByName = await getVirtualSensorsByName()
  const existingVirtualSensorFullNames = new Set(
    Object.values(virtualSensorsByName).map(s => getSensorName(s))
  )
  const sensorsToCreate = config.sensors.filter(
    s => !existingVirtualSensorFullNames.has(getSensorName(s))
  )
  // TODO: Remove unused sensors that we've created
  for (const sensor of sensorsToCreate) {
    await createSensor(sensor)
    console.log(`created virtual sensor ${getSensorName(sensor)}`)
  }
  invalidateSensors() // New sensors may have been created

  updateConfig({ ...getConfig(), ...config })
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url

    if (!url) {
      res.writeHead(400)
      res.end('')
      console.warn(`Request with no URL`)
      return
    }

    if (
      !Object.entries(req.headers).some(([key, value]) => {
        if (key.toLowerCase().trim() !== 'authorization') return false
        const valueParseResult = apiKeySchema.safeParse(value)
        if (
          valueParseResult.success &&
          valueParseResult.data.toLowerCase().includes(apiKey)
        )
          return true
      })
    ) {
      res.writeHead(401)
      res.end('')
      console.warn(`Rejected request, unrecognised apikey`)
      return
    }

    if (req.method === 'PUT' && url === '/config') {
      let body = ''
      req.on('data', chunk => {
        body += chunk
      })
      req.on('end', async () => {
        await putConfig(body)
        res.writeHead(200)
        res.end()
      })
      return
    }

    if (req.method === 'POST' && url.startsWith('/sensors')) {
      let body = ''
      req.on('data', chunk => {
        body += chunk
      })
      req.on('end', async () => {
        body = body.trim()
        const valueParseResult = postSensorValueSchema.safeParse(
          body.length > 0 ? JSON.parse(body) : undefined
        )
        let value = true
        if (valueParseResult.success) {
          value = valueParseResult.data ?? true
        } else {
          console.warn(
            `Invalid body for sensor value. Should be empty, true or false. Falling back to true. Was: ${body}`
          )
        }

        const virtualSensorsByName = await getVirtualSensorsByName()
        const sensorName = url.replace('/sensors/', '')
        const sensor = virtualSensorsByName[sensorName]
        if (!sensor) {
          res.writeHead(400)
          res.end('')
          console.warn(`Sensor not recognised.`)
          return
        }

        await updateSensorState({
          sensorId: sensor.id,
          value,
        })
        res.writeHead(200)
        res.end()
        console.log(`updated sensor ${sensorName} state`)
      })
      return
    }

    if (req.method === 'GET' && url.startsWith('/sensors')) {
      const virtualSensorsByName = await getVirtualSensorsByName()
      const sensorName = url.replace('/sensors/', '')
      const sensor = virtualSensorsByName[sensorName]
      if (!sensor) {
        res.writeHead(400)
        res.end('')
        console.warn(`Sensor not recognised.`)
        return
      }

      const value = await getSensorState({
        sensorId: sensor.id,
      })
      res.writeHead(200)
      res.end(value.toString())
      console.log(`Responded with sensor ${sensorName} state`)

      return
    }

    res.writeHead(404)
    res.end('')
    console.warn(
      `Rejected request to unsupported url/method ${req.url} ${req.method}`
    )
  } catch (err) {
    res.writeHead(500)
    res.end('Internal Server Error')
    console.error(err)
  }
})

export const startApi = () => {
  server.listen(port, host, () => {
    console.log(`API is running on http://${host}:${port}`)
  })
}
