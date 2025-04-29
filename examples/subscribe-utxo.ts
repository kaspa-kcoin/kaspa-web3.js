import { RpcClient, NetworkId, Resolver } from '../src';

async function subscribeUtxo(address: string) {
  const networkId = NetworkId.Testnet10;
  const rpcClient = new RpcClient({ resolver: new Resolver(), networkId });

  rpcClient.addEventListener('UtxosChanged', (data) => {
    console.log('[KASPA Utxo changed]', data);
  });
  await rpcClient.subscribeUtxosChanged([address]);
}

const address = 'kaspatest:qptse3wdeeygc960dy84y45xr3y8nuggs8fq500tc2gq243lts6ckk3slrdzf';
// bun run examples/subscribe-utxo.ts
subscribeUtxo(address);
