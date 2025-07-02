import { RpcClient, NetworkId, KnsRpcClient, kaspaToSompi, Resolver } from '../../src';

/**
 * Example demonstrating how to transfer a KNS domain
 *
 * This example shows how to:
 * 1. Set up the KNS client
 * 2. Transfer a KNS domain to another address
 * 3. Handle the response
 */
async function transferKnsDomain() {
  // Replace with your private key
  const privateKey = 'your-private-key-hex-here';

  // Set up the network and clients
  const networkId = NetworkId.Testnet10; // Use Testnet10 for testing
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const knsClient = new KnsRpcClient({ networkId, rpcClient });

  // Define the domain ID and recipient address
  const domainId = 'your-domain-id-here'; // The ID of the domain you want to transfer
  const recipientAddress = 'kaspatest:recipient-address-here'; // The address to transfer the domain to

  // Set the priority fee for the transaction (in sompi)
  const revealTxPriorityFee = kaspaToSompi(0.02);

  try {
    // Transfer the domain
    const transferOptions = {
      id: domainId,
      to: recipientAddress
    };

    console.log(`Transferring KNS domain with ID ${domainId} to ${recipientAddress}...`);
    const transactionId = await knsClient.transfer(transferOptions, revealTxPriorityFee, privateKey);

    console.log(`Domain transfer successful! Transaction ID: ${transactionId}`);
    console.log(`You can check the status of the operation using knsClient.getKnsOperationDetails('${transactionId}')`);
  } catch (error) {
    console.error('Domain transfer failed:', error);
  }
}

// Run the example
// bun run examples/kns/transfer.ts
transferKnsDomain();
