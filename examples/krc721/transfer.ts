import { RpcClient, NetworkId, Resolver, kaspaToSompi } from '../../src';
import { Krc721RpcClient } from '../../src/krc721/rpc-client';

async function transferKrc721Token() {
  const privateKey = 'your-private-key-hex-here';
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });
  const krc721client = new Krc721RpcClient({ networkId, rpcClient });

  // Define the transfer details
  const tick = 'TEST721';
  const tokenId = '1'; // The ID of the token you want to transfer
  const receiverAddress = 'kaspatest:qz0lv2c28udl76ys2c3nsgdhvpusnjscsgxw7cpe4mcazl0tp9rynlgrzfv37';
  const transferFee = kaspaToSompi(0.01); // 0.01 KAS fee for transfer

  try {
    // Check token ownership before transfer
    const tokenDetails = await krc721client.getTokenDetails(tick, tokenId);
    console.log(`Token ${tokenId} currently owned by: ${tokenDetails.result?.owner}`);

    const transferOptions = {
      tick,
      tokenId,
      to: receiverAddress
    };

    const transactionId = await krc721client.transfer(transferOptions, transferFee, privateKey);
    console.log(`Transfer successful! Transaction ID: ${transactionId}`);

    // Wait a moment for the transaction to be processed
    console.log('Waiting for transaction to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify the new ownership
    const updatedTokenDetails = await krc721client.getTokenDetails(tick, tokenId);
    console.log(`Token ${tokenId} is now owned by: ${updatedTokenDetails.result?.owner}`);

    // Check transfer history
    const ownershipHistory = await krc721client.getTokenOwnershipHistory(tick, tokenId);
    console.log('Ownership history:', ownershipHistory);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
}

// Run with: bun run examples/krc721/transfer.ts
transferKrc721Token();
