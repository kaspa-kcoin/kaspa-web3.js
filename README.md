# Kaspa JS SDK

## Overview

The Kaspa JS SDK is a JavaScript/TypeScript library for interacting with the Kaspa blockchain. It provides various utilities and functions to facilitate blockchain operations.

## Installation

To install the dependencies, use the following command:

```sh
yarn install
```

## Scripts

- `dev`: Start the development server using Vite.
- `test`: Run tests using Vitest.
- `build`: Build the project using Vite.
- `lint`: Lint the codebase using ESLint.
- `preview`: Preview the production build using Vite.
- `proto-gen`: Generate protobuf files.
- `format`: Format the codebase using Prettier.

Run any script using:

```sh
yarn <script-name>
```

## Usage

### Development

To start the development server:

```typescript
import { Generator, SignableTransaction, Encoding, NetworkId, Resolver } from 'your-sdk-path';

const SENDER_ADDR = 'sender-address';
const RECEIVER_ADDR = 'receiver-address';
const TESTNET_10 = new NetworkId(NetworkType.Testnet, 10);
const PRIORITY_FEES = new Fees(kaspaToSompi(0.02));

const networkId = new NetworkId(NetworkType.Testnet, 10);
const encoding = Encoding.JSON;
const sentKas10 = new SendKasParams(SENDER_ADDR, kaspaToSompi(10), RECEIVER_ADDR, TESTNET_10, PRIORITY_FEES);
const rpcClient = new KaspadWrpcClient(networkId, encoding);
const utxos = await rpcClient.getUtxosByAddress(SENDER_ADDR);
const generator = new Generator(sentKas10.toGeneratorSettings(utxos));
const txs = new Array<SignableTransaction>();

while (true) {
  const transaction = generator.generateTransaction();
  if (transaction === undefined) {
    break;
  }
  txs.push(transaction);
}

// sign & submit
for (const tx of txs) {
  tx.sign([your - privateKey]);
  await rpcClient.submitTransaction({
    transaction: tx.toSubmitable(),
    allowOrphan: false
  });
}
```

### Building

To build the project:

```sh
yarn build
```

### Testing

To run tests:

```sh
yarn test
```

## Dependencies

### Production

- `@noble/curves`
- `@noble/hashes`
- `@noble/secp256k1`
- `buffer`
- `long`
- `nice-grpc-web`
- `protobufjs`
- `toml`
- `websocket-heartbeat-js`

### Development

- `@eslint/js`
- `@rollup/plugin-typescript`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `@vitejs/plugin-vue`
- `eslint`
- `globals`
- `grpc-tools`
- `ts-proto`
- `tslib`
- `typescript`
- `typescript-eslint`
- `vite`
- `vitest`
