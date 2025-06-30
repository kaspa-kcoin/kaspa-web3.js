import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Krc721RpcClient } from '../../src/krc721/rpc-client';
import { NetworkId } from '../../src/consensus';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Krc721PagerRequest } from '../../src/krc721/types';

describe('Krc721RpcClient', () => {
  const networkId = NetworkId.Mainnet;
  const client = new Krc721RpcClient({ networkId });

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

  it('should retrieve KRC-721 collections', async () => {
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-collections.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const req: Krc721PagerRequest = {};
    const result = await client.getCollections(req);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 collection details', async () => {
    const tick = 'APES';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-collection-details.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getCollectionDetails(tick);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 token details', async () => {
    const tick = 'APES';
    const tokenId = '1';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-token-details.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getTokenDetails(tick, tokenId);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 token owners', async () => {
    const tick = 'APES';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-token-owners.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getTokenOwners(tick,);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 address holdings', async () => {
    const address = 'kaspa:qra9hkw7u3cymmsmtsjykal0kx0v93j9nkcvp6mkldh49zwt98qaxwd59hrq9';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-address-holdings.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getAddressHoldings(address);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 address collection holding', async () => {
    const address = 'kaspa:qra9hkw7u3cymmsmtsjykal0kx0v93j9nkcvp6mkldh49zwt98qaxwd59hrq9';
    const tick = 'APES';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-address-collection-holding.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getAddressCollectionHolding(address, tick);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 operations', async () => {
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-operations.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const req: Krc721PagerRequest = {};
    const result = await client.getOperations(req);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 operation details', async () => {
    const operationId = 'some-operation-id';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-operation-details.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getOperationDetailsByTxId(operationId);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 royalty fees', async () => {
    const address = 'kaspa:qra9hkw7u3cymmsmtsjykal0kx0v93j9nkcvp6mkldh49zwt98qaxwd59hrq9';
    const tick = 'APES';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-royalty-fees.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getRoyaltyFees(address, tick);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 ownership history', async () => {
    const tick = 'APES';
    const tokenId = '1';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-ownership-history.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getTokenOwnershipHistory(tick, tokenId);
    expect(result).toEqual(response);
  });

  it('should retrieve KRC-721 token ranges', async () => {
    const tick = 'APES';
    const response = JSON.parse(readFileSync(join(__dirname, 'data', 'get-token-ranges.json'), 'utf-8'));

    // Mock the fetch response
    (global.fetch as any).mockResolvedValue({
      json: async () => response
    });

    const result = await client.getAvailableTokenRanges(tick);
    expect(result).toEqual(response);
  });
});
