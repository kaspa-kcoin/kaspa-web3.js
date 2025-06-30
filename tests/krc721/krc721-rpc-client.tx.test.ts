import { describe, expect, it } from 'vitest';
import { Krc721RpcClient } from '../../src/krc721/rpc-client';
import { NetworkId } from '../../src/consensus';
import { RpcClient } from '../../src/rpc/rpc-client';
import { kaspaToSompi } from '../../src/utils';
import { Krc721DeployOptions, Krc721MintOptions, Krc721TransferOptions } from '../../src/krc721/tx-params';

const privateKey = 'your-private-key-hex';

describe.sequential('Krc721RpcClient', () => {
  it.skip('should deploy a new KRC-721 collection successfully', async () => {
    const networkId = NetworkId.Testnet10;
    const rpcClient = new RpcClient({ endpoint: 'wss://proton-10.kaspa.stream/kaspa/testnet-10/wrpc/json' });
    const client = new Krc721RpcClient({ networkId, rpcClient });

    // Minimum deploy fee for KRC-721
    const revealPriorityFee = kaspaToSompi(1000);
    const deployOptions: Krc721DeployOptions = {
      tick: 'APES',
      max: '10000',  // 10,000 tokens max
      buri: 'ipfs://QmYourBaseURI/'
    };

    const result = await client.deploy(deployOptions, revealPriorityFee, privateKey);
    expect(result.length).greaterThan(0);
    console.log(`Deploy result: ${result}`);
  }, 100000);

  it.skip('should mint a new KRC-721 token successfully', async () => {
    const networkId = NetworkId.Testnet10;
    const rpcClient = new RpcClient({ endpoint: 'wss://proton-10.kaspa.stream/kaspa/testnet-10/wrpc/json' });
    const client = new Krc721RpcClient({ networkId, rpcClient });

    const revealPriorityFee = kaspaToSompi(10);
    const mintOptions: Krc721MintOptions = {
      tick: 'APES',
    };

    const result = await client.mint(mintOptions, revealPriorityFee, privateKey);
    expect(result.length).greaterThan(0);
    console.log(`Mint result: ${result}`);
  }, 100000);

  it.skip('should transfer a KRC-721 token successfully', async () => {
    const networkId = NetworkId.Testnet10;
    const rpcClient = new RpcClient({ endpoint: 'wss://proton-10.kaspa.stream/kaspa/testnet-10/wrpc/json' });
    const client = new Krc721RpcClient({ networkId, rpcClient });

    const receiverAddress = 'kaspatest:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjxlgfr8qcz';
    const revealPriorityFee = kaspaToSompi(0.01);
    const transferOptions: Krc721TransferOptions = {
      tick: 'APES',
      tokenId: '11',
      to: receiverAddress
    };

    const result = await client.transfer(transferOptions, revealPriorityFee, privateKey);
    expect(result.length).greaterThan(0);
    console.log(`Transfer result: ${result}`);
  }, 100000);
});
