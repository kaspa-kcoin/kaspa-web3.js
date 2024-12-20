import * as toml from 'toml';
import { INodeDescriptor, IResolverConfig } from './types';
import { RESOLVER_CONFIG } from './config';
import { NetworkId } from '../../consensus';
import { Encoding } from './encoding';

const CURRENT_VERSION = 2;

class Resolver {
  private readonly urls: string[];
  private readonly tls: boolean;

  constructor(urls: string[] | null = null, tls: boolean = true) {
    if (urls && urls.length === 0) {
      throw new Error('Resolver: Empty URL list supplied to the constructor.');
    }

    this.urls = urls || tryParseResolvers(RESOLVER_CONFIG);
    this.tls = tls;
  }

  getUrls(): string[] | null {
    return this.urls;
  }

  getTls(): boolean {
    return this.tls;
  }

  private tlsAsStr(): string {
    return this.tls ? 'tls' : 'any';
  }

  private makeUrl(url: string, encoding: Encoding, networkId: NetworkId): string {
    const tls = this.tlsAsStr();
    return `${url}/v${CURRENT_VERSION}/kaspa/${networkId.toString()}/${tls}/wrpc/${encoding}`;
  }

  private async fetchNodeInfo(url: string, encoding: Encoding, networkId: NetworkId): Promise<INodeDescriptor> {
    const fullUrl = this.makeUrl(url, encoding, networkId);

    const response = await fetch(fullUrl);
    if (response.ok) {
      return JSON.parse(await response.text());
    }
    throw new Error(`Failed to connect ${fullUrl}: ${response.statusText}`);
  }

  private async fetch(encoding: Encoding, networkId: NetworkId): Promise<INodeDescriptor> {
    const urls = [...this.urls];
    const fetchPromises = urls.map((url) => this.fetchNodeInfo(url, encoding, networkId));
    try {
      // get the first successful response, or throw an error if all failed
      return await Promise.any(fetchPromises);
    } catch (error) {
      throw new Error(`Network error: ${error}`);
    }
  }

  fromConfig(config: string): Resolver {
    return new Resolver(tryParseResolvers(config));
  }

  async getNode(encoding: Encoding, networkId: NetworkId): Promise<INodeDescriptor> {
    return this.fetch(encoding, networkId);
  }

  async getUrl(encoding: Encoding, networkId: NetworkId): Promise<string> {
    const node = await this.fetch(encoding, networkId);
    return node.url;
  }
}

function tryParseResolvers(tomlConfig: string): string[] {
  const config: IResolverConfig = toml.parse(tomlConfig);

  let resolvers = config.resolver.filter((resolver) => resolver.enable !== false).map((resolver) => resolver.address);

  const groups = config.group.filter((group) => group.enable !== false);

  for (const group of groups) {
    const { template, nodes } = group;
    for (const node of nodes) {
      resolvers.push(template.replace('*', node));
    }
  }

  return resolvers;
}

export { Resolver, Encoding, tryParseResolvers };
