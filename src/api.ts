import http from 'http'
import { parse } from 'yaml'
import { getConfig, updateConfig } from './config'
import { configSchema, postSensorValueSchema } from './types'
import { getVirtualSensorsByName, invalidateSensors } from './virtual-sensors'
import { createSensor, updateSensorState } from './gateway-client'

const host = '0.0.0.0'
const port = 14202

const getSensorName = ({ name, type }: { name: string; type: string }) =>
  `/${type}/${name}`

const putConfig = async (configYaml: string) => {
  const config = configSchema.pick({ sensors: true }).parse(parse(configYaml))

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
  invalidateSensors()

  updateConfig({ ...getConfig(), ...config })
}

const server = http.createServer((req, res) => {
  const { gatewayApiKey } = getConfig()
  const url = req.url

  if (!url) {
    res.writeHead(400)
    res.end('')
    console.warn(`Request with no URL`)
    return
  }

  // TODO: Separate auth mechanism
  if (req.headers['apikey'] !== gatewayApiKey) {
    res.writeHead(401)
    res.end('')
    console.warn(`Rejected request to unrecognised apikey`)
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

  res.writeHead(404)
  res.end('')
  console.warn(
    `Rejected request to unsupported url/method ${req.url} ${req.method}`
  )
})

export const startApi = () => {
  server.listen(port, host, () => {
    console.log(`API is running on http://${host}:${port}`)
  })
}
