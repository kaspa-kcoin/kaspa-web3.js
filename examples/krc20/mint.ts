import { RpcClient, NetworkId, Krc20RpcClient, kaspaToSompi, Resolver } from '../../src';

async function mintKrc20Tokens() {
  const privateKey = 'your-private-key-hex-here';
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const krc20client = new Krc20RpcClient({ networkId, rpcClient });

  // Define the mint options
  const tick = 'your-tick';
  const receiverAddress = 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9';
  const revealTxPriorityFee = kaspaToSompi(0.02);

  try {
    const mintOptions = {
      tick,
      to: receiverAddress
    };
    const transactionId = await krc20client.mint(mintOptions, revealTxPriorityFee, privateKey);
    console.log(`Mint successful! Transaction ID: ${transactionId}`);
  } catch (error) {
    console.error('Mint failed:', error);
  }
}

// bun run examples/krc20/mint.ts
mintKrc20Tokens();
