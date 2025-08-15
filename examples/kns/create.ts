/**
 * Example demonstrating how to create a KNS domain
 *
 * This example shows how to:
 * 1. Set up the KNS client
 * 2. Create a new KNS domain
 * 3. Handle the response
 */
import { NetworkId } from '../../src/consensus';
import { RpcClient } from '../../src/rpc/rpc-client';
import { Resolver } from '../../src/rpc/resolver';
import { KnsRpcClient } from '../../src/kns/rpc-client';
import { kaspaToSompi } from '../../src';

async function createKnsDomain() {
  // Replace with your private key
  const privateKey = 'your-private-key-hex-here';

  // Set up the network and clients
  const networkId = NetworkId.Testnet10; // Use Testnet10 for testing
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const knsClient = new KnsRpcClient({ networkId, rpcClient });

  // Define the domain name you want to create
  const domainName = 'unique-domain-name'; // The domain name you want to create

  try {
    // Create the domain
    const createOptions = {
      domain: domainName
    };

    // Set the priority fee for the transaction (in sompi)
    const revealTxPriorityFee = kaspaToSompi(0.02);

    console.log(`Creating KNS domain "${domainName}"...`);
    // Note: The fee is automatically calculated based on domain length
    const transactionId = await knsClient.create(createOptions, revealTxPriorityFee, privateKey);

    console.log(`Domain creation successful! Transaction ID: ${transactionId}`);
    console.log(`You can check the status of the operation once indexed`);
  } catch (error) {
    console.error('Domain creation failed:', error);
  }
}

// Run the example
// bun run examples/kns/create.ts
createKnsDomain().catch(console.error);
