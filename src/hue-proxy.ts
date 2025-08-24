#!/usr/bin/env node

import { Command } from 'commander'
import { getConfig, updateConfig } from './config'
import { registration } from './registration'
import { startApi } from './api'
import { getApiKey } from './api-key'

// TODO: Ideally have hue-proxy.ts called index.ts and hue-proxy-launch.ts as just launch.ts

const program = new Command()

program
  .version(require('../package.json').version)
  .description('Proxying hue sensors for more secure and flexible automation.')

program
  .command('start')
  .description('start API')
  .action(options => {
    if (getConfig().gatewayApiKey === undefined) {
      console.error('Cannot start, gateway info not set')
      return
    }
    startApi()
  })

program
  .command('register')
  .description('register a background service with API')
  .action(async options => {
    await registration({ action: 'register' })
  })

program
  .command('unregister')
  .description('unregister the background service with API')
  .action(options => registration({ action: 'unregister' }))

program
  .command('apikey')
  .description('manage the apikey for the proxy')
  .command('show')
  .description('Show the proxy apikey to be provided in all api calls')
  .action(options => console.log(`Proxy apikey: ${getApiKey()}`))

// TODO: Consider this being managed via the API
const gateway = program
  .command('gateway')
  .description('manage the gateway to proxy')

gateway
  .command('set <baseurl> <apiKey>')
  .description('set the gateway to proxy')
  .action((url: string, apiKey: string) => {
    updateConfig({ ...getConfig(), gatewayUrl: url, gatewayApiKey: apiKey })
  })

gateway
  .command('get')
  .description('get the gateway to proxy')
  .action(() => {
    const { gatewayUrl, gatewayApiKey } = getConfig()
    const gateway = {
      url: gatewayUrl,
      apiKey: gatewayApiKey
        ? `${gatewayApiKey.substring(0, 4)}********`
        : undefined,
    }
    console.log(JSON.stringify(gateway))
  })

program.parse(process.argv)
