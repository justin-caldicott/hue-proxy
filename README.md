# hue-proxy

Proxying hue sensors for more secure and flexible automation.

Default port of 14202 is not configurable currently.

## Usage

### Pre-requisites

- yarn: `npm i -g yarn`

### Installation

Currently, the package is not published to npm. So first make a tgz package:

- `yarn build`
- copy the package to the target machine, e.g. using `scp`
- ssh to the target machine
- `sudo npm install -g path-to-tgz-file`

#### Soon, once published to npm

On a machine where you want run hue-proxy:

- Install node 22 or above
- Install the tool with `npm install -g hue-proxy`

### Quick start

```sh
hue-proxy gateway set <YOUR_GATEWAY_BASE_URL> <YOUR_GATEWAY_API_KEY>
```

From any machine with access to the machine running hue-proxy:

```sh
curl -H "apikey: YOUR_GATEWAY_API_KEY" -X PUT --data-binary @some-path-to/hue-proxy.yml http://some-host:14202/config
```

Note: The gateway apikey is used to also authenticate requests to PUT /config.

Note: The baseurl host should use 127.0.0.1 instead of localhost.

Example `hue-proxy.yml`:

```yml
sensors:
  - name: doorbell
    type: CLIPGenericFlag
```

## Contributing

Please raise issues for any bugs/feature requests.

Testing has been through actual use with a good number of sensors/devices. There are no automated tests yet. Can hopefully add some soonish.

## Release process

Update the version number in `package.json` and:

```sh
yarn build
npm publish
```
