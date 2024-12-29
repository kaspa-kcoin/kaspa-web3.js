import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RpcClient } from '../../src/rpc/rpc-client';
import { NetworkId } from '../../src';
import {
  AddPeerRequestMessage,
  AddPeerResponseMessage,
  GetBlockCountRequestMessage,
  GetBlockCountResponseMessage,
  GetBlockDagInfoRequestMessage,
  GetBlockDagInfoResponseMessage,
  GetBlockRequestMessage,
  GetBlockResponseMessage,
  GetBlocksRequestMessage,
  GetBlocksResponseMessage,
  GetBlockTemplateRequestMessage,
  GetBlockTemplateResponseMessage,
  GetCurrentNetworkRequestMessage,
  GetCurrentNetworkResponseMessage,
  GetMempoolEntriesRequestMessage,
  GetMempoolEntriesResponseMessage,
  GetMempoolEntryRequestMessage,
  GetMempoolEntryResponseMessage,
  GetPeerAddressesRequestMessage,
  GetPeerAddressesResponseMessage,
  GetSinkRequestMessage,
  GetSinkResponseMessage,
  GetSubnetworkRequestMessage,
  GetSubnetworkResponseMessage,
  GetVirtualChainFromBlockRequestMessage,
  GetVirtualChainFromBlockResponseMessage,
  NotifyBlockAddedResponseMessage,
  PingResponseMessage,
  ResolveFinalityConflictRequestMessage,
  ResolveFinalityConflictResponseMessage,
  SubmitBlockRequestMessage,
  SubmitBlockResponseMessage,
  SubmitTransactionRequestMessage,
  SubmitTransactionResponseMessage,
  ShutdownRequestMessage,
  ShutdownResponseMessage,
  GetHeadersRequestMessage,
  GetHeadersResponseMessage,
  GetUtxosByAddressesRequestMessage,
  GetUtxosByAddressesResponseMessage,
  GetSinkBlueScoreRequestMessage,
  GetSinkBlueScoreResponseMessage,
  BanRequestMessage,
  BanResponseMessage,
  UnbanRequestMessage,
  UnbanResponseMessage,
  GetInfoRequestMessage,
  GetInfoResponseMessage,
  EstimateNetworkHashesPerSecondRequestMessage,
  EstimateNetworkHashesPerSecondResponseMessage,
  GetBalanceByAddressRequestMessage,
  GetBalanceByAddressResponseMessage,
  GetBalancesByAddressesRequestMessage,
  GetBalancesByAddressesResponseMessage,
  GetMempoolEntriesByAddressesRequestMessage,
  GetMempoolEntriesByAddressesResponseMessage,
  GetCoinSupplyRequestMessage,
  GetCoinSupplyResponseMessage,
  GetMetricsRequestMessage,
  GetMetricsResponseMessage,
  GetServerInfoRequestMessage,
  GetServerInfoResponseMessage,
  GetSyncStatusRequestMessage,
  GetSyncStatusResponseMessage,
  GetDaaScoreTimestampEstimateRequestMessage,
  GetDaaScoreTimestampEstimateResponseMessage,
  SubmitTransactionReplacementRequestMessage,
  SubmitTransactionReplacementResponseMessage,
  GetConnectionsRequestMessage,
  GetConnectionsResponseMessage,
  GetSystemInfoRequestMessage,
  GetSystemInfoResponseMessage,
  GetFeeEstimateRequestMessage,
  GetFeeEstimateResponseMessage,
  GetFeeEstimateExperimentalRequestMessage,
  GetFeeEstimateExperimentalResponseMessage,
  GetCurrentBlockColorRequestMessage,
  GetCurrentBlockColorResponseMessage
} from '../../src/rpc/types';
import { WebSocketServer } from 'ws';
import { RpcEventType } from '../../src/rpc/events';
import fs from 'fs';
import path from 'path';

describe('RpcClient', () => {
  let server: WebSocketServer;
  let client: RpcClient;

  beforeEach(() => {
    server = new WebSocketServer({ port: 8080 });
    client = new RpcClient({ endpoint: 'ws://localhost:8080' });
  });

  afterEach(() => {
    server.close();
  });

  function loadJsonData<T>(filename: string): T {
    const filePath = path.resolve(__dirname, `./data/${filename}`);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  function setupWebSocketServer(server: WebSocketServer, method: string, response: any) {
    server.on('connection', (ws: any) => {
      ws.on('message', (message: any) => {
        const request = JSON.parse(message.toString());
        if (request.method === method) {
          ws.send(JSON.stringify({ id: request.id, params: response }));
        }
      });
    });
  }

  describe('Constructor', () => {
    it('should create instance with endpoint', () => {
      const client = new RpcClient({ endpoint: 'ws://localhost:8080' });
      expect(client).toBeDefined();
    });
    it('should create instance with resolver and networkId', () => {
      const resolver = { getNodeEndpoint: vi.fn() };
      const client = new RpcClient({
        resolver: resolver as any,
        networkId: NetworkId.Mainnet
      });
      expect(client).toBeDefined();
    });

    it('should throw error if no endpoint or resolver provided', () => {
      expect(() => new RpcClient({} as any)).toThrow('No valid resolver or endpoint provided');
    });
  });

  describe('RPC Methods', () => {
    it('should get current network info', async () => {
      const data = loadJsonData<{
        request: GetCurrentNetworkRequestMessage;
        response: GetCurrentNetworkResponseMessage;
      }>('get-current-network.json');

      setupWebSocketServer(server, 'getCurrentNetwork', data.response);

      await client.connect();
      const response = await client.getCurrentNetwork();
      expect(response).toEqual(data.response);
    });

    it('should submit block', async () => {
      const data = loadJsonData<{ request: SubmitBlockRequestMessage; response: SubmitBlockResponseMessage }>(
        'submit-block.json'
      );

      setupWebSocketServer(server, 'submitBlock', data.response);

      await client.connect();
      const response = await client.submitBlock(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get block template', async () => {
      const data = loadJsonData<{
        request: GetBlockTemplateRequestMessage;
        response: GetBlockTemplateResponseMessage;
      }>('get-block-template.json');

      setupWebSocketServer(server, 'getBlockTemplate', data.response);

      await client.connect();
      const response = await client.getBlockTemplate(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get peer addresses', async () => {
      const data = loadJsonData<{
        request: GetPeerAddressesRequestMessage;
        response: GetPeerAddressesResponseMessage;
      }>('get-peer-addresses.json');

      setupWebSocketServer(server, 'getPeerAddresses', data.response);

      await client.connect();
      const response = await client.getPeerAddresses();
      expect(response).toEqual(data.response);
    });

    it('should get sink', async () => {
      const data = loadJsonData<{
        request: GetSinkRequestMessage;
        response: GetSinkResponseMessage;
      }>('get-sink.json');

      setupWebSocketServer(server, 'getSink', data.response);

      await client.connect();
      const response = await client.getSink();
      expect(response).toEqual(data.response);
    });

    it('should get mempool entry', async () => {
      const data = loadJsonData<{
        request: GetMempoolEntryRequestMessage;
        response: GetMempoolEntryResponseMessage;
      }>('get-mempool-entry.json');

      setupWebSocketServer(server, 'getMempoolEntry', data.response);

      await client.connect();
      const response = await client.getMempoolEntry(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get connected peer info', async () => {
      const data = loadJsonData<{
        request: GetPeerAddressesRequestMessage;
        response: GetPeerAddressesResponseMessage;
      }>('get-peer-addresses.json');

      setupWebSocketServer(server, 'getPeerAddresses', data.response);

      await client.connect();
      const response = await client.getPeerAddresses();
      expect(response).toEqual(data.response);
    });

    it('should add peer', async () => {
      const data = loadJsonData<{ request: AddPeerRequestMessage; response: AddPeerResponseMessage }>('add-peer.json');
      setupWebSocketServer(server, 'addPeer', data.response);

      await client.connect();
      const response = await client.addPeer(data.request);
      expect(response).toEqual(data.response);
    });

    it('should submit transaction', async () => {
      const data = loadJsonData<{
        request: SubmitTransactionRequestMessage;
        response: SubmitTransactionResponseMessage;
      }>('submit-transaction.json');
      setupWebSocketServer(server, 'submitTransaction', data.response);

      await client.connect();
      const response = await client.submitTransaction(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get block', async () => {
      const data = loadJsonData<{ request: GetBlockRequestMessage; response: GetBlockResponseMessage }>(
        'get-block.json'
      );
      setupWebSocketServer(server, 'getBlock', data.response);

      await client.connect();
      const response = await client.getBlock(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get subnetwork', async () => {
      const data = loadJsonData<{ request: GetSubnetworkRequestMessage; response: GetSubnetworkResponseMessage }>(
        'get-subnetwork.json'
      );
      setupWebSocketServer(server, 'getSubnetwork', data.response);

      await client.connect();
      const response = await client.getSubnetwork(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get virtual chain from block', async () => {
      const data = loadJsonData<{
        request: GetVirtualChainFromBlockRequestMessage;
        response: GetVirtualChainFromBlockResponseMessage;
      }>('get-virtual-chain-from-block.json');
      setupWebSocketServer(server, 'getVirtualChainFromBlock', data.response);

      await client.connect();
      const response = await client.getVirtualChainFromBlock(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get blocks', async () => {
      const data = loadJsonData<{ request: GetBlocksRequestMessage; response: GetBlocksResponseMessage }>(
        'get-blocks.json'
      );
      setupWebSocketServer(server, 'getBlocks', data.response);

      await client.connect();
      const response = await client.getBlocks(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get block count', async () => {
      const data = loadJsonData<{ request: GetBlockCountRequestMessage; response: GetBlockCountResponseMessage }>(
        'get-block-count.json'
      );
      setupWebSocketServer(server, 'getBlockCount', data.response);

      await client.connect();
      const response = await client.getBlockCount();
      expect(response).toEqual(data.response);
    });

    it('should get block DAG info', async () => {
      const data = loadJsonData<{
        request: GetBlockDagInfoRequestMessage;
        response: GetBlockDagInfoResponseMessage;
      }>('get-block-dag-info.json');

      setupWebSocketServer(server, 'getBlockDagInfo', data.response);

      await client.connect();
      const response = await client.getBlockDagInfo();
      expect(response).toEqual(data.response);
    });

    it('should resolve finality conflict', async () => {
      const data = loadJsonData<{
        request: ResolveFinalityConflictRequestMessage;
        response: ResolveFinalityConflictResponseMessage;
      }>('resolve-finality-conflict.json');
      setupWebSocketServer(server, 'resolveFinalityConflict', data.response);

      await client.connect();
      const response = await client.resolveFinalityConflict(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get mempool entries', async () => {
      const data = loadJsonData<{
        request: GetMempoolEntriesRequestMessage;
        response: GetMempoolEntriesResponseMessage;
      }>('get-mempool-entries.json');
      setupWebSocketServer(server, 'getMempoolEntries', data.response);

      await client.connect();
      const response = await client.getMempoolEntries(data.request);
      expect(response).toEqual(data.response);
    });

    it('should shutdown the node', async () => {
      const data = loadJsonData<{ request: ShutdownRequestMessage; response: ShutdownResponseMessage }>(
        'shutdown.json'
      );

      setupWebSocketServer(server, 'shutdown', data.response);

      await client.connect();
      const response = await client.shutdown();
      expect(response).toEqual(data.response);
    });

    it('should get headers', async () => {
      const data = loadJsonData<{ request: GetHeadersRequestMessage; response: GetHeadersResponseMessage }>(
        'get-headers.json'
      );
      setupWebSocketServer(server, 'getHeaders', data.response);

      await client.connect();
      const response = await client.getHeaders(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get UTXOs by addresses', async () => {
      const data = loadJsonData<{
        request: GetUtxosByAddressesRequestMessage;
        response: GetUtxosByAddressesResponseMessage;
      }>('get-utxos-by-addresses.json');
      setupWebSocketServer(server, 'getUtxosByAddresses', data.response);

      await client.connect();
      const response = await client.getUtxosByAddresses(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get sink blue score', async () => {
      const data = loadJsonData<{ request: GetSinkBlueScoreRequestMessage; response: GetSinkBlueScoreResponseMessage }>(
        'get-sink-blue-score.json'
      );
      setupWebSocketServer(server, 'getSinkBlueScore', data.response);

      await client.connect();
      const response = await client.getSinkBlueScore();
      expect(response).toEqual(data.response);
    });

    it('should handle ban method', async () => {
      const data = loadJsonData<{ request: BanRequestMessage; response: BanResponseMessage }>('ban.json');
      setupWebSocketServer(server, 'ban', data.response);

      await client.connect();
      const response = await client.ban(data.request);
      expect(response).toEqual(data.response);
    });

    it('should handle unban method', async () => {
      const data = loadJsonData<{ request: UnbanRequestMessage; response: UnbanResponseMessage }>('unban.json');
      setupWebSocketServer(server, 'unban', data.response);

      await client.connect();
      const response = await client.unban(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get info', async () => {
      const data = loadJsonData<{ request: GetInfoRequestMessage; response: GetInfoResponseMessage }>('get-info.json');
      setupWebSocketServer(server, 'getInfo', data.response);

      await client.connect();
      const response = await client.getInfo();
      expect(response).toEqual(data.response);
    });

    it('should estimate network hashes per second', async () => {
      const data = loadJsonData<{
        request: EstimateNetworkHashesPerSecondRequestMessage;
        response: EstimateNetworkHashesPerSecondResponseMessage;
      }>('estimate-network-hashes-per-second.json');
      setupWebSocketServer(server, 'estimateNetworkHashesPerSecond', data.response);

      await client.connect();
      const response = await client.estimateNetworkHashesPerSecond(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get balance by address', async () => {
      const data = loadJsonData<{
        request: GetBalanceByAddressRequestMessage;
        response: GetBalanceByAddressResponseMessage;
      }>('get-balance-by-address.json');
      setupWebSocketServer(server, 'getBalanceByAddress', data.response);

      await client.connect();
      const response = await client.getBalanceByAddress(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get balances by addresses', async () => {
      const data = loadJsonData<{
        request: GetBalancesByAddressesRequestMessage;
        response: GetBalancesByAddressesResponseMessage;
      }>('get-balances-by-addresses.json');
      setupWebSocketServer(server, 'getBalancesByAddresses', data.response);

      await client.connect();
      const response = await client.getBalancesByAddresses(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get mempool entries by addresses', async () => {
      const data = loadJsonData<{
        request: GetMempoolEntriesByAddressesRequestMessage;
        response: GetMempoolEntriesByAddressesResponseMessage;
      }>('get-mempool-entries-by-addresses.json');
      setupWebSocketServer(server, 'getMempoolEntriesByAddresses', data.response);

      await client.connect();
      const response = await client.getMempoolEntriesByAddresses(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get coin supply', async () => {
      const data = loadJsonData<{ request: GetCoinSupplyRequestMessage; response: GetCoinSupplyResponseMessage }>(
        'get-coin-supply.json'
      );
      setupWebSocketServer(server, 'getCoinSupply', data.response);

      await client.connect();
      const response = await client.getCoinSupply();
      expect(response).toEqual(data.response);
    });

    it('should ping successfully', async () => {
      const res: PingResponseMessage = { error: undefined };

      server.on('connection', (ws: any) => {
        ws.on('message', (message: any) => {
          const request = JSON.parse(message.toString());
          ws.send(JSON.stringify({ id: request.id, params: res }));
        });
      });

      await client.connect();
      const response = await client.ping();
      expect(response).toEqual(res);
    });

    it('should get metrics', async () => {
      const data = loadJsonData<{ request: GetMetricsRequestMessage; response: GetMetricsResponseMessage }>(
        'get-metrics.json'
      );
      setupWebSocketServer(server, 'getMetrics', data.response);

      await client.connect();
      const response = await client.getMetrics(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get server info', async () => {
      const data = loadJsonData<{ request: GetServerInfoRequestMessage; response: GetServerInfoResponseMessage }>(
        'get-server-info.json'
      );
      setupWebSocketServer(server, 'getServerInfo', data.response);

      await client.connect();
      const response = await client.getServerInfo();
      expect(response).toEqual(data.response);
    });

    it('should get sync status', async () => {
      const data = loadJsonData<{ request: GetSyncStatusRequestMessage; response: GetSyncStatusResponseMessage }>(
        'get-sync-status.json'
      );
      setupWebSocketServer(server, 'getSyncStatus', data.response);

      await client.connect();
      const response = await client.getSyncStatus();
      expect(response).toEqual(data.response);
    });

    it('should get DAA score timestamp estimate', async () => {
      const data = loadJsonData<{
        request: GetDaaScoreTimestampEstimateRequestMessage;
        response: GetDaaScoreTimestampEstimateResponseMessage;
      }>('get-daa-score-timestamp-estimate.json');
      setupWebSocketServer(server, 'getDaaScoreTimestampEstimate', data.response);

      await client.connect();
      const response = await client.getDaaScoreTimestampEstimate(data.request);
      expect(response).toEqual(data.response);
    });

    it('should submit transaction replacement', async () => {
      const data = loadJsonData<{
        request: SubmitTransactionReplacementRequestMessage;
        response: SubmitTransactionReplacementResponseMessage;
      }>('submit-transaction-replacement.json');
      setupWebSocketServer(server, 'submitTransactionReplacement', data.response);

      await client.connect();
      const response = await client.submitTransactionReplacement(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get connections', async () => {
      const data = loadJsonData<{ request: GetConnectionsRequestMessage; response: GetConnectionsResponseMessage }>(
        'get-connections.json'
      );
      setupWebSocketServer(server, 'getConnections', data.response);

      await client.connect();
      const response = await client.getConnections();
      expect(response).toEqual(data.response);
    });

    it('should get system info', async () => {
      const data = loadJsonData<{ request: GetSystemInfoRequestMessage; response: GetSystemInfoResponseMessage }>(
        'get-system-info.json'
      );
      setupWebSocketServer(server, 'getSystemInfo', data.response);

      await client.connect();
      const response = await client.getSystemInfo();
      expect(response).toEqual(data.response);
    });

    it('should get fee estimate', async () => {
      const data = loadJsonData<{ request: GetFeeEstimateRequestMessage; response: GetFeeEstimateResponseMessage }>(
        'get-fee-estimate.json'
      );
      setupWebSocketServer(server, 'getFeeEstimate', data.response);

      await client.connect();
      const response = await client.getFeeEstimate();
      expect(response).toEqual(data.response);
    });

    it('should get experimental fee estimate', async () => {
      const data = loadJsonData<{
        request: GetFeeEstimateExperimentalRequestMessage;
        response: GetFeeEstimateExperimentalResponseMessage;
      }>('get-fee-estimate-experimental.json');
      setupWebSocketServer(server, 'getFeeEstimateExperimental', data.response);

      await client.connect();
      const response = await client.getFeeEstimateExperimental(data.request);
      expect(response).toEqual(data.response);
    });

    it('should get current block color', async () => {
      const data = loadJsonData<{
        request: GetCurrentBlockColorRequestMessage;
        response: GetCurrentBlockColorResponseMessage;
      }>('get-current-block-color.json');
      setupWebSocketServer(server, 'getCurrentBlockColor', data.response);

      await client.connect();
      const response = await client.getCurrentBlockColor(data.request);
      expect(response).toEqual(data.response);
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to block added notifications', async () => {
      const res: NotifyBlockAddedResponseMessage = {
        error: undefined
      };

      server.on('connection', (ws: any) => {
        ws.on('message', (message: any) => {
          const request = JSON.parse(message.toString());
          ws.send(JSON.stringify({ id: request.id, params: res }));
        });
      });

      await client.connect();
      await client.subscribeBlockAdded();
    });

    it('should unsubscribe from block added notifications', async () => {
      const res: NotifyBlockAddedResponseMessage = {
        error: undefined
      };

      server.on('connection', (ws: any) => {
        ws.on('message', (message: any) => {
          const request = JSON.parse(message.toString());
          ws.send(JSON.stringify({ id: request.id, params: res }));
        });
      });

      await client.connect();
      await client.unsubscribeBlockAdded();
    });
  });

  describe('Event Handling', () => {
    it('should add and remove event listeners', () => {
      const callback = vi.fn();
      client.addEventListener(RpcEventType.BlockAdded, callback);
      expect(client['eventListeners'].length).toBe(1);

      client.removeEventListener(RpcEventType.BlockAdded, callback);
      expect(client['eventListeners'].length).toBe(0);
    });

    it('should clear all event listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      client.addEventListener(RpcEventType.BlockAdded, callback1);
      client.addEventListener(RpcEventType.VirtualDaaScoreChanged, callback2);
      expect(client['eventListeners'].length).toBe(2);

      client.removeAllEventListeners();
      expect(client['eventListeners'].length).toBe(0);
    });
  });
});
