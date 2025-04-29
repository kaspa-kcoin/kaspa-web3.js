import { RpcClient, NetworkId, kaspaToSompi, Resolver, SendKasParams, Fees, Generator } from '../src';

async function transferKas() {
  // Load private key from environment variable to avoid hardcoding secrets
  const privateKey = process.env.KASPA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('KASPA_PRIVATE_KEY environment variable is required');
  }
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const PRIORITY_FEES = new Fees(kaspaToSompi(0.02));
  // Define the receiver's address and transfer details
  // Replace with your own addresses or load from environment variables
  const senderAddress = process.env.KASPA_SENDER_ADDRESS || 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9';
  const receiverAddress = process.env.KASPA_RECEIVER_ADDRESS || 'kaspatest:qptse3wdeeygc960dy84y45xr3y8nuggs8fq500tc2gq243lts6ckk3slrdzf';
  
  const amount = kaspaToSompi(10);
  console.log(`Sending ${amount} KAS from ${senderAddress} to ${receiverAddress}`);
  const sentKasParams = new SendKasParams(receiverAddress, amount, receiverAddress, NetworkId.Testnet10, PRIORITY_FEES);
  const { entries: utxos } = await rpcClient.getUtxosByAddresses([senderAddress]);
  const generator = new Generator(sentKasParams.toGeneratorSettings(utxos));

  while (true) {
    try {
      const transaction = generator.generateTransaction();
      if (transaction === undefined) {
        console.log('No more transactions to generate');
        break;
      }

      const signedTx = await transaction.sign([privateKey]);
      const result = await rpcClient.submitTransaction({
        transaction: signedTx.toSubmittableJsonTx(),
        allowOrphan: false
      });
      console.log(`Transaction ${signedTx.transaction.id} sent successfully!`);
    } catch (error) {
      console.error('Error generating or submitting transaction:', error);
      throw error; // Rethrow to stop the process or handle as needed
    }
  }
}

// bun run examples/sendKas.ts
transferKas();
