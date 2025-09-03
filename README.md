# Kaspa Web3.js SDK

[![Test Status](https://github.com/kaspa-kcoin/kaspa-web3.js/actions/workflows/test.yml/badge.svg)](https://github.com/kaspa-kcoin/kaspa-web3.js/actions/workflows/test.yml)
[![Build Status](https://github.com/kaspa-kcoin/kaspa-web3.js/actions/workflows/build.yml/badge.svg)](https://github.com/kaspa-kcoin/kaspa-web3.js/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/@kcoin/kaspa-web3.js.svg)](https://www.npmjs.com/package/@kcoin/kaspa-web3.js)

## Overview

The Kaspa Web3.js SDK is a JavaScript/TypeScript library for interacting with the Kaspa blockchain. It provides utilities and functions to facilitate blockchain operations, including sending KAS, KRC-20 tokens, and KRC-721 NFT tokens.

**Note:** The `RpcClient` in this SDK only supports WebSocket JSON-RPC requests.

## Installation

Install the SDK using npm or yarn:

```sh
npm install @kcoin/kaspa-web3.js
```

or

```sh
yarn add @kcoin/kaspa-web3.js
```

## Usage

### Creating an RpcClient

You can create an instance of `RpcClient` using either an endpoint or a resolver with a network ID.

#### Using an Endpoint

```typescript
import { RpcClient } from '@kcoin/kaspa-web3.js';

const client = new RpcClient({
  endpoint: 'ws://localhost:18210'
});

await client.connect();
```

#### Using a Resolver

```typescript
import { RpcClient, NetworkId, Resolver } from '@kcoin/kaspa-web3.js';

const client = new RpcClient({
  resolver: new Resolver(),
  // resolver: Resolver.createWithEndpoints([your-endpoints]),
  // Resolver will test the endpoints and select the fastest one.
  networkId: NetworkId.Mainnet
});

await client.connect();
```

### Sending KAS

To send KAS, create and submit a transaction using the `Generator`:

```typescript
import { RpcClient, Generator, NetworkId, kaspaToSompi, Fees, SendKasParams } from '@kcoin/kaspa-web3.js';

// Initialize the RpcClient
const rpcClient = new RpcClient({
  endpoint: 'ws://localhost:18210' // Replace with your actual endpoint
});

// Define transaction parameters
const SENDER_ADDR = 'kaspatest:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjxlgfr8qcz';
const RECEIVER_ADDR = 'kaspatest:qrjcg7hsgjapumpn8egyu6544qzdqs2lssas4nfwewl55lnenr5pyzd7cmyx6';
const networkId = NetworkId.Testnet10;
const amount = kaspaToSompi(10); // Convert KAS to Sompi
const priorityFees = new Fees(kaspaToSompi(0.02)); // Optional priority fee
const privateKey = 'your-private-key-hex'; // WARNING: Never hardcode private keys in production code

// Perform the transaction
async function sendKAS() {
  try {
    await rpcClient.connect(); // Ensure the RpcClient is connected
    const utxos = await rpcClient.getUtxosByAddress(SENDER_ADDR);
    const sendKasParams = new SendKasParams(SENDER_ADDR, amount, RECEIVER_ADDR, networkId, priorityFees);
    const generator = new Generator(sendKasParams.toGeneratorSettings(utxos));

    while (true) {
      const transaction = generator.generateTransaction();
      if (!transaction) break;
      transaction.sign([privateKey]);
      const response = await rpcClient.submitTransaction({
        transaction: transaction.toSubmittableJsonTx(),
        allowOrphan: false
      });
    }

    const finalTransactionId = generator.summary().finalTransactionId!.toHex();
    console.log('Final Transaction ID:', finalTransactionId);
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}

sendKAS();
```

### KRC-20 Token Operations

This section provides examples of how to deploy, mint, and transfer KRC-20 tokens using the `Krc20RpcClient` class.

#### Prerequisites

- Ensure you have a valid private key for the operations.
- Set up your environment with the necessary dependencies and configurations.

#### Example Scripts

- **Deploy a KRC-20 Token**: [deploy.ts](examples/krc20/deploy.ts)

  - Demonstrates how to deploy a new KRC-20 token with specified parameters.

- **Mint KRC-20 Tokens**: [mint.ts](examples/krc20/mint.ts)

  - Shows how to mint additional tokens to a specified address.

- **Transfer KRC-20 Tokens**: [transfer.ts](examples/krc20/transfer.ts)
  - Illustrates transferring tokens from one address to another.

### KNS Domain Operations

This section provides examples of how to perform operations on Kaspa Name Service (KNS) domains using the `KnsRpcClient` class.

#### Prerequisites

- Ensure you have a valid private key for the operations.
- Set up your environment with the necessary dependencies and configurations.

#### Example Scripts

- **Transfer a KNS Domain**: [transfer.ts](examples/kns/transfer.ts)
  - Demonstrates how to transfer ownership of a KNS domain to another address.

#### Running the Scripts

To run any of the scripts, use the following command:

```bash
bun run examples/krc20/<script-name>.ts
```

Replace `<script-name>` with the name of the script you want to execute (e.g., `deploy`, `mint`, or `transfer`).

### KRC-721 Token Operations

This section provides examples of how to interact with KRC-721 tokens (Non-Fungible Tokens) using the `Krc721RpcClient` class.

#### Prerequisites

- Ensure you have a valid private key for the operations.
- Set up your environment with the necessary dependencies and configurations.

#### Example Scripts

- **Deploy a KRC-721 Collection**: [deploy.ts](examples/krc721/deploy.ts)

  - Demonstrates how to deploy a new NFT collection with specified parameters.

- **Mint KRC-721 Tokens**: [mint.ts](examples/krc721/mint.ts)

  - Shows how to mint a new NFT to a specified address.

- **Transfer KRC-721 Tokens**: [transfer.ts](examples/krc721/transfer.ts)

  - Illustrates transferring an NFT from one address to another.

- **Set Discount for KRC-721 Minting**: [discount.ts](examples/krc721/discount.ts)

  - Shows how to set a discount for minting operations.

#### Running the Scripts

To run any of the scripts, use the following command:

```bash
bun run examples/krc721/<script-name>.ts
```

Replace `<script-name>` with the name of the script you want to execute (e.g., `deploy`, `mint`, `transfer`, or `discount`).

### Event Subscriptions

You can subscribe to various events using the `RpcClient`.

#### Subscribe to Block Added Notifications

```typescript
await client.subscribeBlockAdded();
await client.addEventListener(RpcEventType.BlockAdded, (eventData) => {
  console.log('Block added:', eventData);
});
```

#### Unsubscribe from Block Added Notifications

```typescript
await client.unsubscribeBlockAdded();
```

### Error Handling

The `RpcClient` provides error handling for RPC requests. Ensure to catch errors when making requests:

```typescript
try {
  const response = await client.getCurrentNetwork();
  console.log(response);
} catch (error) {
  console.error('Error fetching network info:', error);
}
```

## FAQ

<details>
  <summary>1. What functionalities are implemented in Kaspa Web3.js?</summary>

Kaspa Web3.js implements transaction construction, signing, and related hashing. It includes the following components:

- `Keypair`: Represents a pair of public and private keys used for cryptographic operations.
- `TxScriptBuilder`: A utility for constructing transaction scripts.
- `RpcClient`: A client for interacting with the Kaspa blockchain via WebSocket JSON-RPC requests.
- `Generator`: A class for generating transactions, including inputs, outputs, and fees.
- `Resolver`: A utility for resolving network endpoints and selecting the fastest one.
- `Krc20RpcClient`: A specialized RPC client for interacting with KRC-20 tokens on the Kaspa blockchain.
- `Krc721RpcClient`: A specialized RPC client for interacting with KRC-721 NFT tokens on the Kaspa blockchain.

</details>

<details>
  <summary>2. What communication protocols does RpcClient support?</summary>

RpcClient only supports WebSocket with JSON serialization. It includes the full implementation of RPC methods and subscribe-related interfaces.

</details>

<details>
  <summary>3. Why does RpcClient only implement JSON WebSocket?</summary>

- GRPC does not support duplex communication in browsers.
- Borsh serialization encoded WebSocket can become incompatible with minor changes in node data structures, making it difficult to maintain.
- JSON serialization provides better compatibility, so kaspa-web3.js exclusively uses JSON WebSocket.

</details>

## Dependencies

- `@noble/curves`: ^1.7.0
- `@noble/hashes`: ^1.6.1
- `@noble/secp256k1`: ^2.2.1
- `buffer`: ^6.0.3
- `toml`: ^3.0.0
- `websocket-heartbeat-js`: ^1.1.3

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the [MIT License](./LICENSE).

## Donations

If you find this project useful and would like to support its development, you can send KAS donations to the following address:

```text
kaspa:qzyrvjcaama3ecf8reg7evxxz0pl80nx9fwas5rcw5udqj4x2jyf26jufex4z
```
