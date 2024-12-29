import { INodeDescriptor } from './types';
import { RESOLVER_CONFIG } from './config';
import { NetworkId } from '../../consensus';
import { tryParseResolvers } from './index';

const CURRENT_VERSION = 2;

/**
 * Abstract class representing a base resolver for network nodes.
 */
abstract class BaseResolver {
  protected readonly seedAddresses: string[];
  protected readonly tls: boolean;

  /**
   * Constructs.
   * @param {string[] | null} seeds - An array of seed addresses or null.
   * @param {boolean} tls - Indicates if TLS should be used.
   * @throws {Error} If an empty seeds list is supplied.
   */
  protected constructor(seeds: string[] | null = null, tls: boolean = true) {
    if (seeds && seeds.length === 0) {
      throw new Error('Resolver: Empty seeds list supplied to the constructor.');
    }

    this.seedAddresses = seeds || tryParseResolvers(RESOLVER_CONFIG);
    this.tls = tls;
  }

  /**
   * Gets the seed addresses.
   * @returns {string[]} An array of seed addresses.
   */
  public getSeeds(): string[] {
    return this.seedAddresses;
  }

  /**
   * Gets the TLS setting.
   * @returns {boolean} True if TLS is enabled, false otherwise.
   */
  public getTls(): boolean {
    return this.tls;
  }

  /**
   * Fetches the endpoint of a node for the given network ID.
   * @param {NetworkId} networkId - The network ID.
   * @returns {Promise<string>} A promise that resolves to the node URL.
   */
  protected async getNodeEndpoint(networkId: NetworkId): Promise<string> {
    const node = await this.fetch(networkId);
    return node.url;
  }

  /**
   * Fetches the endpoints of all nodes for the given network ID.
   * @param {NetworkId} networkId - The network ID.
   * @returns {Promise<string[]>} A promise that resolves to an array of node URLs.
   */
  protected async getAllNodeEndpoints(networkId: NetworkId): Promise<string[]> {
    const nodes = await this.fetchAll(networkId);
    return nodes.map((node) => node.url);
  }

  /**
   * Converts the TLS setting to a string.
   * @returns {string} 'tls' if TLS is enabled, 'any' otherwise.
   */
  private tlsAsStr(): string {
    return this.tls ? 'tls' : 'any';
  }

  /**
   * Constructs a URL for the given base URL and network ID.
   * @param {string} url - The base URL.
   * @param {NetworkId} networkId - The network ID.
   * @returns {string} The constructed URL.
   */
  private makeUrl(url: string, networkId: NetworkId): string {
    const tls = this.tlsAsStr();
    return `${url}/v${CURRENT_VERSION}/kaspa/${networkId.toString()}/${tls}/wrpc/borsh`;
  }

  /**
   * Fetches node information from the given URL and network ID.
   * @param {string} url - The URL to fetch from.
   * @param {NetworkId} networkId - The network ID.
   * @returns {Promise<INodeDescriptor>} A promise that resolves to a node descriptor.
   * @throws {Error} If the request fails or times out.
   */
  private async fetchNodeInfo(url: string, networkId: NetworkId): Promise<INodeDescriptor> {
    const fullUrl = this.makeUrl(url, networkId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    let response: Response;

    try {
      response = await fetch(fullUrl, { signal: controller.signal });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out: ${fullUrl}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
    if (response.ok) {
      return JSON.parse(await response.text());
    }
    throw new Error(`Failed to connect ${fullUrl}: ${response.statusText}`);
  }

  /**
   * Fetches a node descriptor for the given network ID from the seed addresses.
   * @param {NetworkId} networkId - The network ID.
   * @returns {Promise<INodeDescriptor>} A promise that resolves to a node descriptor.
   * @throws {Error} If all fetch attempts fail.
   */
  private async fetch(networkId: NetworkId): Promise<INodeDescriptor> {
    const fetchPromises = this.seedAddresses.map((seed) => this.fetchNodeInfo(seed, networkId));
    try {
      // get the first successful response, or throw an error if all failed
      return await Promise.any(fetchPromises);
    } catch (error) {
      throw new Error(`Network error: ${error}`);
    }
  }

  /**
   * Fetches all node descriptors for the given network ID from the seed addresses.
   * @param {NetworkId} networkId - The network ID.
   * @returns {Promise<INodeDescriptor[]>} A promise that resolves to an array of node descriptors.
   */
  private async fetchAll(networkId: NetworkId): Promise<INodeDescriptor[]> {
    const results: INodeDescriptor[] = [];
    const fetchPromises = this.seedAddresses.map((seed) =>
      this.fetchNodeInfo(seed, networkId)
        .then((node) => results.push(node))
        .catch(() => null)
    );

    await Promise.allSettled(fetchPromises);
    return results;
  }
}

export { BaseResolver };
