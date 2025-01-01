import { RpcClient, NetworkId, Krc20RpcClient, kaspaToSompi, Resolver } from '../../src';

async function transferKrc20Tokens() {
  const privateKey = 'your-private-key-hex-here';
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const krc20client = new Krc20RpcClient({ networkId, rpcClient });

  // Define the receiver's address and transfer details
  const receiverAddress = 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9';
  const tick = 'your-tick';
  const decimals = 8n;
  const amount = 10n * 10n ** decimals;
  const revealTxPriorityFee = kaspaToSompi(0.02);

  try {
    const transferOptions = {
      tick,
      to: receiverAddress,
      amount
    };
    const transactionId = await krc20client.transfer(transferOptions, revealTxPriorityFee, privateKey);
    console.log(`Transfer successful! Transaction ID: ${transactionId}`);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
}

// bun run examples/krc20/transfer.ts
transferKrc20Tokens();
