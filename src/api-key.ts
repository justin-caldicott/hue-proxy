import os from 'os'
import * as fse from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'

const apiKeyPath = `${os.homedir()}/.hue-proxy-apikey`

let apiKey: string | null = null

export const getApiKey = () => {
  if (apiKey) {
    return apiKey
  }
  if (fse.existsSync(apiKeyPath)) {
    apiKey = fse.readFileSync(apiKeyPath, 'utf-8')
    return apiKey
  }
  apiKey = uuidv4()
  fse.writeFileSync(apiKeyPath, apiKey)
  return apiKey
}
