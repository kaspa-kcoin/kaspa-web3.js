import { INodeDescriptor } from './types';
import { RESOLVER_CONFIG } from './config';
import { NetworkId } from '../../consensus';
import { tryParseResolvers } from './index.ts';

const CURRENT_VERSION = 2;

class BorshResolver {
  private readonly seeds: string[];
  private readonly tls: boolean;

  constructor(seeds: string[] | null = null, tls: boolean = true) {
    if (seeds && seeds.length === 0) {
      throw new Error('BorshResolver: Empty seeds list supplied to the constructor.');
    }

    this.seeds = seeds || tryParseResolvers(RESOLVER_CONFIG);
    this.tls = tls;
  }

  getSeeds(): string[] {
    return this.seeds;
  }

  getTls(): boolean {
    return this.tls;
  }

  private tlsAsStr(): string {
    return this.tls ? 'tls' : 'any';
  }

  private makeUrl(url: string, networkId: NetworkId): string {
    const tls = this.tlsAsStr();
    return `${url}/v${CURRENT_VERSION}/kaspa/${networkId.toString()}/${tls}/wrpc/borsh`;
  }

  private async fetchNodeInfo(url: string, networkId: NetworkId): Promise<INodeDescriptor> {
    const fullUrl = this.makeUrl(url, networkId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(fullUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return JSON.parse(await response.text());
      }
      throw new Error(`Failed to connect ${fullUrl}: ${response.statusText}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out: ${fullUrl}`);
      }
      throw error;
    }
  }

  private async fetch(networkId: NetworkId): Promise<INodeDescriptor> {
    const fetchPromises = this.seeds.map((seed) => this.fetchNodeInfo(seed, networkId));
    try {
      // get the first successful response, or throw an error if all failed
      return await Promise.any(fetchPromises);
    } catch (error) {
      throw new Error(`Network error: ${error}`);
    }
  }

  fromConfig(config: string): BorshResolver {
    return new BorshResolver(tryParseResolvers(config));
  }

  async getNode(networkId: NetworkId): Promise<INodeDescriptor> {
    return this.fetch(networkId);
  }

  async getUrl(networkId: NetworkId): Promise<string> {
    const node = await this.fetch(networkId);
    return node.url;
  }

  private async fetchAll(networkId: NetworkId): Promise<INodeDescriptor[]> {
    const results: INodeDescriptor[] = [];
    const fetchPromises = this.seeds.map((seed) =>
      this.fetchNodeInfo(seed, networkId)
        .then(node => results.push(node))
        .catch(() => null)
    );

    await Promise.allSettled(fetchPromises);
    return results;
  }

  async getAllNodes(networkId: NetworkId): Promise<INodeDescriptor[]> {
    return this.fetchAll(networkId);
  }

  async getAllUrls(networkId: NetworkId): Promise<string[]> {
    const nodes = await this.fetchAll(networkId);
    return nodes.map(node => node.url);
  }
}

export { BorshResolver };