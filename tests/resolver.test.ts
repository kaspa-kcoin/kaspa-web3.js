import { describe, expect, it, vi } from 'vitest';
import { Resolver, Encoding, tryParseResolvers } from '../src/rpc/resolver/index';
import { NetworkId, NetworkType } from '../src/consensus/network';

const TESTNET_10 = new NetworkId(NetworkType.Testnet, 10);
const ENCODING = Encoding.JSON;

describe('Resolver', () => {
  const mockToml = `
    [[group]]
    enable = true
    template = "https://*.example.org"
    nodes = ["alpha", "beta"]

    [[resolver]]
    enable = true
    address = "http://127.0.0.1:8888"
  `;

  it('should parse resolvers from TOML', () => {
    const urls = tryParseResolvers(mockToml);
    expect(urls).toEqual(['http://127.0.0.1:8888', 'https://alpha.example.org', 'https://beta.example.org']);
  });

  it('should return urls', () => {
    const urls = tryParseResolvers(mockToml);
    const resolver = new Resolver(urls);
    expect(resolver.getUrls()).equals(urls);
  });

  it('should return URLs for custom configuration', () => {
    const customUrls = ['http://custom-url.com'];
    const resolver = new Resolver(customUrls, true);
    expect(resolver.getUrls()).toEqual(customUrls);
  });

  it('should return the correct TLS flag', () => {
    const resolver = new Resolver(null, true);
    expect(resolver.getTls()).toBe(true);
  });

  it('should make the correct URL', () => {
    const resolver = new Resolver(['http://example.com'], true);
    const url = resolver['makeUrl']('http://example.com', ENCODING, new NetworkId(NetworkType.Mainnet));
    expect(url).toBe(`http://example.com/v2/kaspa/mainnet/tls/wrpc/${ENCODING}`);
  });

  it('should fetch node info successfully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ uid: '123', url: 'http://node-url.com' }))
      })
    ) as unknown as typeof fetch;

    const resolver = new Resolver(['http://example.com'], true);
    const nodeInfo = await resolver['fetchNodeInfo']('http://example.com', ENCODING, TESTNET_10);
    expect(nodeInfo).toEqual({ uid: '123', url: 'http://node-url.com' });
  });

  it('should throw an error if fetch fails', async () => {
    global.fetch = vi.fn(() => Promise.reject('Network error')) as unknown as typeof fetch;

    const resolver = new Resolver(['http://example.com'], true);
    await expect(resolver['fetchNodeInfo']('http://example.com', ENCODING, TESTNET_10)).rejects.toThrow(
      /Network error/
    );
  });

  it('should fetch node successfully from multiple URLs', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('example1')) {
        return Promise.reject('Network error');
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ uid: '123', url: 'http://node-url.com' }))
      });
    }) as unknown as typeof fetch;

    const resolver = new Resolver(['http://example1.com', 'http://example2.com'], true);
    const nodeInfo = await resolver['fetch'](ENCODING, TESTNET_10);
    expect(nodeInfo).toEqual({ uid: '123', url: 'http://node-url.com' });
  });

  it('should throw an error if all fetch attempts fail', async () => {
    global.fetch = vi.fn(() => Promise.reject('Network error')) as unknown as typeof fetch;

    const resolver = new Resolver(['http://example1.com', 'http://example2.com'], true);
    await expect(resolver['fetch'](ENCODING, TESTNET_10)).rejects.toThrowError(/Network error/);
  });

  // it('real', async () => {
  //   const resolver = new Resolver(null, true);
  //   const url = await resolver.getUrl(ENCODING, TESTNET_10);
  //   expect(url).length.greaterThan(0);
  // }, 1000000);
});
