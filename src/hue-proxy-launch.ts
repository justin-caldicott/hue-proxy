#!/usr/bin/env node

import { startApi } from './api'
import { getConfig } from './config'

if (getConfig().gatewayApiKey === undefined) {
  throw new Error('Cannot start, gateway info not set')
}

startApi()
