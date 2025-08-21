import { getSensors as fetchSensors } from './gateway-client'
import { Sensor } from './types'

let virtualSensorsByNameInstance: Record<
  string,
  Sensor & { id: string }
> | null = null

// TODO: Explore stronger typing
const virtualSensorTypes = new Set(['CLIPGenericFlag']) //, 'CLIPGenericStatus'])

export const getVirtualSensorsByName = async (): Promise<
  Record<string, Sensor & { id: string }>
> => {
  const sensors =
    virtualSensorsByNameInstance ??
    Object.entries(await fetchSensors())
      .filter(([_, sensor]) => virtualSensorTypes.has(sensor.type))
      .reduce(
        (acc, [sensorId, sensor]) => ({
          ...acc,
          ...{ [sensor.name]: { ...sensor, id: sensorId } },
        }),
        {}
      )
  virtualSensorsByNameInstance = sensors
  return sensors
}

// TODO: Incrementally patch sensors on updates instead
export const invalidateSensors = () => {
  virtualSensorsByNameInstance = null
}
