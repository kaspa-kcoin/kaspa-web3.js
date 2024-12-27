import { NetworkId } from '../../consensus';
import { BaseResolver } from './base-resolver.ts';

/**
 * Resolver class that extends the BaseResolver class.
 * This resolver only supports JSON WebSocket endpoints.
 */
class Resolver extends BaseResolver {
  constructor(seedAddresses: string[] | null = null, tls: boolean = true) {
    super(seedAddresses, tls);
  }

  override async getNodeEndpoint(networkId: NetworkId): Promise<string> {
    const endpoints = await super.getAllNodeEndpoints(networkId);
    const jsonEndpoints = endpoints.map((url) => url.replace('borsh', 'json'));

    const promises = jsonEndpoints.map(async (endpoint) => {
      return this.testConnection(endpoint).then((reachableEndpoint) => reachableEndpoint).catch(() => null);
    });

    const result = await Promise.any(promises);
    if (result === null) {
      throw new Error('No valid endpoint found');
    }

    return result;
  }

  override async getAllNodeEndpoints(networkId: NetworkId): Promise<string[]> {
    const endpoints = await super.getAllNodeEndpoints(networkId);
    const jsonEndpoints = endpoints.map((url) => url.replace('borsh', 'json'));
    const reachableEndpoints: string[] = [];

    const promises = jsonEndpoints.map((endpoint) =>
      this.testConnection(endpoint).then((reachableEndpoint) => reachableEndpoints.push(reachableEndpoint)).catch(() => null)
    );

    await Promise.allSettled(promises);
    return reachableEndpoints;
  }

  private testConnection = (endpoint: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const client = new WebSocket(endpoint);
      client.onopen = () => {
        client.close();
        resolve(endpoint);
      };

      client.onerror = (event) => {
        reject(new Error(`WebSocket error: ${event}`));
      };
    });
  };
}

export { Resolver };