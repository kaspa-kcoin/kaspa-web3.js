# Kaspa Web3.js SDK

## Overview

The Kaspa Web3.js SDK is a JavaScript/TypeScript library for interacting with the Kaspa blockchain. It provides various utilities and functions to facilitate blockchain operations, including sending KAS and KRC20 tokens.

**Note:** The `RpcClient` in this SDK only supports WebSocket JSON-RPC requests.

## Installation

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
  networkId: NetworkId.Mainnet
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
  amount: kaspaToSompi(1000),
  receiverAddress: RECEIVER_ADDR,
  networkId
});

const transactions = generator.generateTransactions(utxos);

for (const tx of transactions) {
  tx.sign([yourPrivateKey]);
  const response = await rpcClient.submitTransaction({
    transaction: tx.toSubmittableJsonTx(),
    allowOrphan: false
  });
  console.log('Transaction submitted:', response);
}
```

### Sending KRC-20 Tokens

The `Krc20RpcClient` provides a method to transfer KRC-20 tokens from one address to another. Below is an example of how to use the `transfer` method.

### Example Code

```typescript
import { Krc20RpcClient } from './src/krc20/rpc-client';
import { RpcClient, NetworkId } from './src/consensus';

// Initialize the RpcClient
const rpcClient = new RpcClient({
  endpoint: 'ws://localhost:18210' // Replace with your actual endpoint
});

// Initialize the Krc20RpcClient
const krc20RpcClient = new Krc20RpcClient({
  networkId: NetworkId.Mainnet,
  rpcClient: rpcClient
});

// Define transfer parameters
const receiverAddress = 'kaspatest:qpcl6nup27rmd4dvx20xj50f6mlm8zt6s9nxznlwvjspfzy9v4rxvfkug838j';
const amount = BigInt('1000000000'); // Amount in smallest unit
const tick = 'AVETA';
const privateKey = 'your-private-key-hex'; // Replace with your private key
const priorityFee = kaspaToSompi(0.02); // Optional priority fee, 0.02 KAS

// Perform the transfer
async function transferTokens() {
  try {
    await rpcClient.connect(); // Ensure the RpcClient is connected
    const transactionId = await krc20RpcClient.transfer(receiverAddress, amount, tick, privateKey, priorityFee);
    console.log(`Transfer successful! Transaction ID: ${transactionId}`);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
}

transferTokens();
```

### Explanation

- **`RpcClient`**: This is used to interact with the blockchain and must be passed to the `Krc20RpcClient` when you need to transfer krc20 tokens.
- **`receiverAddress`**: The address to which the tokens will be sent.
- **`amount`**: The amount of tokens to transfer, specified in the smallest unit.
- **`tick`**: The ticker symbol of the KRC-20 token.
- **`privateKey`**: The private key of the sender's address in hexadecimal format.
- **`priorityFee`**: An optional fee to prioritize the transaction.

This example demonstrates how to use the `transfer` method to send KRC-20 tokens. Ensure you replace the placeholder values with actual data before running the script.

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
- `buffer`: ^6.0.3
- `toml`: ^3.0.0
- `websocket-heartbeat-js`: ^1.1.3

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
