import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RpcClient } from '../src/rpc/rpc-client';
import { NetworkId } from '../src';
import {
  GetBlockDagInfoResponseMessage,
  GetCurrentNetworkResponseMessage,
  NotifyBlockAddedResponseMessage,
  PingResponseMessage,
  RpcBlock,
  SubmitBlockRequestMessage,
  SubmitBlockResponseMessage,
  SubmitBlockResponseMessage_RejectReason
} from '../src/rpc/types';
import { WebSocketServer } from 'ws';
import { RpcEventType } from '../src/rpc/events';

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
      const res: GetCurrentNetworkResponseMessage = {
        currentNetwork: "testnet",
        error: undefined
      };

      server.on('connection', (ws:any) => {
        ws.on('message', (message:any) => {
          const request = JSON.parse(message.toString());
          ws.send(JSON.stringify({ id: request.id, params: res }));
        });
      });

      await client.connect();
      const response = await client.getCurrentNetwork();
      expect(response).toEqual(res);
    });

    it('should submit block', async () => {
      const block: RpcBlock = {
        header: {
          version: 1,
          parents: [],
          hashMerkleRoot: '',
          acceptedIdMerkleRoot: '',
          utxoCommitment: '',
          timestamp: 0,
          bits: 0,
          nonce: 0,
          daaScore: 0,
          blueWork: '',
          pruningPoint: '',
          blueScore: 0
        },
        transactions: [],
        verboseData: undefined
      };

      const req: SubmitBlockRequestMessage = {
        block,
        allowNonDAABlocks: false
      };

      const res: SubmitBlockResponseMessage = {
        rejectReason:  SubmitBlockResponseMessage_RejectReason.NONE,
        error: undefined
      };

      server.on('connection', (ws:any) => {
        ws.on('message', (message:any) => {
          const request = JSON.parse(message.toString());
          ws.send(JSON.stringify({ id: request.id, params: res }));
        });
      });

      await client.connect();
      const response = await client.submitBlock(req);
      expect(response).toEqual(res);
    });

    it('should get block DAG info', async () => {
      const res: GetBlockDagInfoResponseMessage = {
        networkName: 'mainnet',
        blockCount: 100,
        headerCount: 100,
        tipHashes: ['hash1', 'hash2'],
        difficulty: 1000,
        pastMedianTime: 123456789,
        virtualParentHashes: ['parentHash1'],
        pruningPointHash: 'pruningHash',
        virtualDaaScore: 500,
        sink: 'sinkHash',
        error: undefined
      };

      server.on('connection', (ws:any) => {
        ws.on('message', (message:any) => {
          const request = JSON.parse(message.toString());
          ws.send(JSON.stringify({ id: request.id, params: res }));
        });
      });

      await client.connect();
      const response = await client.getBlockDagInfo();
      expect(response).toEqual(res);
    });

    it('should ping successfully', async () => {
      const res: PingResponseMessage = {error: undefined};

      server.on('connection', (ws:any) => {
        ws.on('message', (message:any) => {
          const request = JSON.parse(message.toString());
          ws.send(JSON.stringify({ id: request.id, params: res }));
        });
      });

      await client.connect();
      const response = await client.ping();
      expect(response).toEqual(res);
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to block added notifications', async () => {
      const res: NotifyBlockAddedResponseMessage = {
        error: undefined
      };

      server.on('connection', (ws:any) => {
        ws.on('message', (message:any) => {
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

      server.on('connection', (ws:any) => {
        ws.on('message', (message:any) => {
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
