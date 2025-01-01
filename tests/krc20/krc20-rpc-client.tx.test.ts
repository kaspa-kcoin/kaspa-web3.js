import { describe, it, expect } from 'vitest';
// import { Krc20RpcClient } from '../../src/krc20/rpc-client';
// import { NetworkId } from '../../src/consensus';
// import { RpcClient } from '../../src/rpc/rpc-client';
// import { kaspaToSompi } from '../../src/utils';
// import { Krc20DeployOptions, Krc20MintOptions, Krc20TransferOptions } from '../../src';

// const privateKey = 'your-private-key-hex';

describe('Krc20RpcClient', () => {
  it('1+1 should equals 2', async () => {
    expect(1 + 1).equals(2);
  });
  //   it('should deploy a new KRC-20 token successfully', async () => {
  //     const networkId = NetworkId.Testnet10;
  //     const rpcClient = new RpcClient({ endpoint: 'wss://proton-10.kaspa.stream/kaspa/testnet-10/wrpc/json' });
  //     const client = new Krc20RpcClient({ networkId, rpcClient });

  //     const decimals = 8n;
  //     // Minimum deploy fee is 1000 $KAS
  //     const revealPriorityFee = kaspaToSompi(1000);
  //     const deployOptions: Krc20DeployOptions = {
  //       tick: 'kkkz',
  //       max: 100n * 10n ** decimals, // 100 KAST
  //       lim: 10n * 10n ** decimals // 10 KAST
  //     };
  //     const result = await client.deploy(deployOptions, revealPriorityFee, privateKey);
  //     expect(result.length).greaterThan(0);
  //     console.log(`Deploy result: ${result}`);
  //   }, 100000);

  //   it('should mint additional KRC-20 tokens successfully', async () => {
  //     const networkId = NetworkId.Testnet10;
  //     const rpcClient = new RpcClient({ endpoint: 'wss://proton-10.kaspa.stream/kaspa/testnet-10/wrpc/json' });
  //     const client = new Krc20RpcClient({ networkId, rpcClient });

  //     // Minimum mint fee is 1 $KAS
  //     const revealPriorityFee = kaspaToSompi(1);
  //     const mintOptions: Krc20MintOptions = { tick: 'kkkz' };
  //     const result = await client.mint(mintOptions, revealPriorityFee, privateKey);
  //     expect(result.length).greaterThan(0);
  //     console.log(`Mint result: ${result}`);
  //   }, 100000);

  //   it('should transfer KRC-20 tokens successfully', async () => {
  //     const networkId = NetworkId.Testnet10;
  //     const rpcClient = new RpcClient({ endpoint: 'wss://proton-10.kaspa.stream/kaspa/testnet-10/wrpc/json' });
  //     const client = new Krc20RpcClient({ networkId, rpcClient });

  //     const receiverAddress = 'kaspatest:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjxlgfr8qcz';
  //     const decimals = 8n;
  //     const revealPriorityFee = kaspaToSompi(0.001);
  //     const transferOptions: Krc20TransferOptions = {
  //       tick: 'KAST',
  //       to: receiverAddress,
  //       amount: 10n * 10n ** decimals // 10 KAST
  //     };
  //     const result = await client.transfer(transferOptions, revealPriorityFee, privateKey);

  //     console.log(`Transfer result: ${result}`);
  //   }, 100000000);
});
