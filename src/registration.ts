import * as fse from 'fs-extra'
import { exec as execWithCallback } from 'child_process'
import util from 'util'

const exec = util.promisify(execWithCallback)

export const registration = async ({
  action,
}: {
  action: 'register' | 'unregister'
}) => {
  // TODO: Try to get this from the OS
  const serviceDefinitionPath = `/usr/lib/systemd/system/hue-proxy.service`

  if (action === 'register') {
    // TODO: Allow to inject non-root user somehow. Because this is ran with sudo, we can't get it via USER.
    const serviceDefinition = `[Unit]
Description=hue-proxy background process
After=network.target

[Service]
Type=simple
User=${'pi'}
ExecStart=/usr/lib/node_modules/hue-proxy/dist/hue-proxy-launch.js
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
`

    fse.writeFileSync(serviceDefinitionPath, serviceDefinition)

    // TODO: Make this cross-platform, not just linux
    await exec('systemctl daemon-reload')
    await exec('systemctl start hue-proxy')

    console.log('Background service registered')
  } else if (action === 'unregister') {
    await exec('systemctl stop hue-proxy')
    fse.removeSync(serviceDefinitionPath)
    await exec('systemctl daemon-reload')

    console.log('Background service unregistered')
  }
}
