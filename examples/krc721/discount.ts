import { RpcClient, NetworkId, Resolver, kaspaToSompi } from '../../src';
import { Krc721RpcClient } from '../../src/krc721/rpc-client';

async function setKrc721Discount() {
  const privateKey = 'your-private-key-hex-here'; // Collection owner's private key
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const krc721client = new Krc721RpcClient({ networkId, rpcClient });

  // Define the discount details
  const tick = 'TEST721';
  const beneficiaryAddress = 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9';
  const discountFee = kaspaToSompi(5).toString(); // Reduced fee of 5 KAS instead of standard 10 KAS
  const setDiscountFee = kaspaToSompi(0.01); // 0.01 KAS fee for setting the discount

  try {
    // First check if we're the collection owner
    const collectionDetails = await krc721client.getCollectionDetails(tick);
    console.log('Collection details:', collectionDetails);

    const discountOptions = {
      tick,
      to: beneficiaryAddress,
      discountFee
    };

    const transactionId = await krc721client.discount(discountOptions, setDiscountFee, privateKey);
    console.log(`Discount set successfully! Transaction ID: ${transactionId}`);
    console.log(`Address ${beneficiaryAddress} can now mint ${tick} tokens for ${discountFee} sompi`);

    // Try getting royalty fees to verify discount
    const royaltyInfo = await krc721client.getRoyaltyFees(beneficiaryAddress, tick);
    console.log('Royalty/fee information:', royaltyInfo);
  } catch (error) {
    console.error('Setting discount failed:', error);
  }
}

// Run with: bun run examples/krc721/discount.ts
setKrc721Discount();
