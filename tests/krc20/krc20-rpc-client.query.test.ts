import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Krc20RpcClient } from '../../src/krc20/rpc-client';
import { NetworkId } from '../../src/consensus';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Krc20RpcClient', () => {
  const networkId = NetworkId.Mainnet;
  const client = new Krc20RpcClient({ networkId });

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(); // Mock the global fetch function
  });

  it('should retrieve indexer status', async () => {
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-indexer-status.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getIndexerStatus();
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 token info', async () => {
    const tick = 'AVETA';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-token-info.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20TokenInfo(tick);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 token list', async () => {
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-token-list.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20TokenList();
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 address token list', async () => {
    const address = 'kaspatest:qra9hkw7u3cymmsmtsjykal0kx0v93j9nkcvp6mkldh49zwt98qaxwd59hrq9';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-address-token-list.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20AddressTokenList(address);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 balance', async () => {
    const address = 'kaspatest:qra9hkw7u3cymmsmtsjykal0kx0v93j9nkcvp6mkldh49zwt98qaxwd59hrq9';
    const tick = 'AVETA';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-balance.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20Balance(address, tick);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 operation list', async () => {
    const address = 'kaspatest:qra9hkw7u3cymmsmtsjykal0kx0v93j9nkcvp6mkldh49zwt98qaxwd59hrq9';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-operation-list.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20OperationList(address);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 operation details', async () => {
    const operationId = 'some-operation-id';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-operation-details.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20OperationDetails(operationId);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 VSPC details', async () => {
    const vspcId = 'some-vspc-id';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-vspc-details.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20VspcDetails(vspcId);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 data by OP range', async () => {
    const opRange = 'some-op-range';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-data-by-oprange.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20DataByOPrange(opRange);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-20 listing list', async () => {
    const tick = 'AVETA';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-listing-list.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getKrc20ListingList(tick);
    expect(result).toEqual(response);
  });
});
