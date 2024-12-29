# Kaspa Web3.js SDK

## Overview

The Kaspa Web3.js SDK is a JavaScript/TypeScript library for interacting with the Kaspa blockchain. It provides various utilities and functions to facilitate blockchain operations, including sending KAS and KRC20 tokens.

**Note:** The `RpcClient` in this SDK only supports WebSocket JSON-RPC requests.

## Installation

<details>
  <summary>npm</summary>

  ```sh
  npm install @kcoin/kaspa-web3.js
  ```

</details>

<details>
  <summary>Yarn</summary>

  ```sh
  yarn add @kcoin/kaspa-web3.js
  ```

</details>

## Scripts

- `dev`: Start the development server using Vite.
- `test`: Run tests using Vitest.
- `build`: Build the project using Vite.
- `lint`: Lint the codebase using ESLint.
- `preview`: Preview the production build using Vite.
- `format`: Format the codebase using Prettier.

Run any script using:

```sh
npm run <script-name>
```

## Usage

### Creating an RpcClient

You can create an instance of `RpcClient` using either an endpoint or a resolver with a network ID.

#### Using an Endpoint

```typescript
import { RpcClient } from '@kcoin/kaspa-web3.js';

const client = new RpcClient({
  endpoint: 'ws://localhost:18210',
});

await client.connect();
```

#### Using a Resolver

```typescript
import { RpcClient, NetworkId, Resolver } from '@kcoin/kaspa-web3.js';

const client = new RpcClient({
  resolver: new Resolver(),
  networkId: NetworkId.Mainnet,
});

await client.connect();
```

### Sending KAS

To send KAS, you need to create and submit a transaction using the `Generator`:

```typescript
import { Generator, SignableTransaction, NetworkId } from '@kcoin/kaspa-web3.js';

const SENDER_ADDR = 'sender-address';
const RECEIVER_ADDR = 'receiver-address';
const networkId = NetworkId.Testnet10;
const rpcClient = new RpcClient({ endpoint: 'ws://localhost:18210' });

await rpcClient.connect();
const utxos = await rpcClient.getUtxosByAddress(SENDER_ADDR);
const generator = new Generator({
  senderAddress: SENDER_ADDR,
  amount: 1000000, // Amount in sompi
  receiverAddress: RECEIVER_ADDR,
  networkId,
});

const transactions = generator.generateTransactions(utxos);

for (const tx of transactions) {
  tx.sign([yourPrivateKey]);
  const response = await rpcClient.submitTransaction({
    transaction: tx.toSubmitable(),
    allowOrphan: false,
  });
  console.log('Transaction submitted:', response);
}
```

### Sending KRC20 Tokens

To send KRC20 tokens, you need to interact with the smart contract using the `Generator`:

```typescript
import { Generator, SignableTransaction, NetworkId } from '@kcoin/kaspa-web3.js';

const SENDER_ADDR = 'sender-address';
const RECEIVER_ADDR = 'receiver-address';
const TOKEN_CONTRACT_ADDR = 'token-contract-address';
const networkId = NetworkId.Testnet10;
const rpcClient = new RpcClient({ endpoint: 'ws://localhost:18210' });

await rpcClient.connect();
const utxos = await rpcClient.getUtxosByAddress(SENDER_ADDR);
const generator = new Generator({
  senderAddress: SENDER_ADDR,
  amount: 1000, // Token amount
  receiverAddress: RECEIVER_ADDR,
  contractAddress: TOKEN_CONTRACT_ADDR,
  networkId,
});

const transactions = generator.generateTransactions(utxos);

for (const tx of transactions) {
  tx.sign([yourPrivateKey]);
  const response = await rpcClient.submitTransaction({
    transaction: tx.toSubmitable(),
    allowOrphan: false,
  });
  console.log('KRC20 Transaction submitted:', response);
}
```

### Event Subscriptions

You can subscribe to various events using the `RpcClient`.

#### Subscribe to Block Added Notifications

```typescript
await client.subscribeBlockAdded();
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

## Development

### Building the SDK

To build the SDK, run:

```sh
npm run build
```

### Running Tests

To run the test suite, use:

```sh
npm run test
```

### Formatting Code

To format the code using Prettier, run:

```sh
npm run format
```

## Dependencies

### Production

- `@noble/curves`: ^1.7.0
- `@noble/hashes`: ^1.6.1
- `@noble/secp256k1`: ^2.1.0
- `buffer`: ^6.0.3rea
- `toml`: ^3.0.0
- `websocket-heartbeat-js`: ^1.1.3


## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
