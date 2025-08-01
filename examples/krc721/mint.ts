import { RpcClient, NetworkId, Resolver, kaspaToSompi } from '../../src';
import { Krc721RpcClient } from '../../src/krc721/rpc-client';

async function mintKrc721Token() {
  const privateKey = 'your-private-key-hex-here';
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const krc721client = new Krc721RpcClient({ networkId, rpcClient });

  // Define the mint options
  const tick = 'TEST721';
  const receiverAddress = 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9';
  const mintFee = kaspaToSompi(10); // 10 KAS fee for minting

  try {
    // Check if collection has royalties
    const collectionDetails = await krc721client.getCollectionDetails(tick);
    console.log('Collection details:', collectionDetails);

    let royaltyBeneficiary;
    if (collectionDetails.result?.royaltyFee && collectionDetails.result?.royaltyTo) {
      royaltyBeneficiary = {
        address: collectionDetails.result.royaltyTo,
        amount: BigInt(collectionDetails.result.royaltyFee)
      };
      console.log(`Royalty payment of ${royaltyBeneficiary.amount} will be sent to ${royaltyBeneficiary.address}`);
    }

    const mintOptions = {
      tick,
      to: receiverAddress // Optional - defaults to sender if not specified
    };

    const transactionId = await krc721client.mint(
      mintOptions, 
      mintFee, 
      privateKey,
      royaltyBeneficiary
    );

    console.log(`Mint successful! Transaction ID: ${transactionId}`);

    // Check token ownership after mint
    const tokenOwners = await krc721client.getTokenOwners(tick);
    console.log('Token owners:', tokenOwners);
  } catch (error) {
    console.error('Mint failed:', error);
  }
}

// Run with: bun run examples/krc721/mint.ts
mintKrc721Token();
