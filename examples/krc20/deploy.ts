import { RpcClient, NetworkId, Krc20RpcClient, kaspaToSompi, Resolver } from '../../src';

async function deployKrc20Token() {
  const privateKey = 'your-private-key-hex-here';
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const krc20client = new Krc20RpcClient({ networkId, rpcClient });

  // Define the deployment options
  const tick = 'your-tick';
  const decimals = 8n;
  const maxSupply = 1000n * 10n ** decimals;
  const limit = 100n * 10n ** decimals;
  const priorityFee = kaspaToSompi(0.02);

  try {
    const deployOptions = {
      tick,
      max: maxSupply,
      lim: limit,
      dec: Number(decimals)
    };
    const transactionId = await krc20client.deploy(deployOptions, priorityFee, privateKey);
    console.log(`Deploy successful! Transaction ID: ${transactionId}`);
  } catch (error) {
    console.error('Deploy failed:', error);
  }
}

// bun run examples/krc20/deploy.ts
deployKrc20Token();
