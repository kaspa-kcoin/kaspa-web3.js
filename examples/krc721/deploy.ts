import { RpcClient, NetworkId, Resolver, kaspaToSompi } from '../../src';
import { Krc721RpcClient } from '../../src/krc721/rpc-client';

async function deployKrc721Collection() {
  const privateKey = 'your-private-key-hex-here';
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const krc721client = new Krc721RpcClient({ networkId, rpcClient });

  // Define the deployment options
  const tick = 'TEST721';
  const maxSupply = '1000'; // Maximum 1000 NFTs in this collection
  const priorityFee = kaspaToSompi(1000); // 1000 KAS fee for deployment

  // Optional metadata
  const metadata = {
    name: 'Test Collection',
    description: 'A test NFT collection',
    image: 'ipfs://QmYourCIDHere/collection.png',
    attributes: [
      {
        traitType: 'category',
        value: 'test'
      }
    ]
  };

  try {
    const deployOptions = {
      tick,
      max: maxSupply,
      metadata,
      royaltyFee: kaspaToSompi(0.1).toString(), // 0.1 KAS royalty per mint
      royaltyTo: 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9' // Royalty recipient
    };

    const transactionId = await krc721client.deploy(deployOptions, priorityFee, privateKey);
    console.log(`Deploy successful! Transaction ID: ${transactionId}`);
  } catch (error) {
    console.error('Deploy failed:', error);
  }
}

// Run with: bun run examples/krc721/deploy.ts
deployKrc721Collection();
