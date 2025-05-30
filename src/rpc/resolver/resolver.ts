import { NetworkId } from '../../consensus';
import { BaseResolver } from './base-resolver.ts';

/**
 * Resolver class that extends the BaseResolver class.
 * This resolver only supports JSON WebSocket endpoints.
 */
class Resolver extends BaseResolver {
  public extendEndpoints: string[] = [];

  /**
   * Constructs a new instance of the Resolver class.
   * @param {string[] | null} [seedAddresses=null] - The seed addresses for the resolver.
   * @param {boolean} [tls=true] - Indicates whether to use TLS.
   */
  constructor(seedAddresses: string[] | null = null, tls: boolean = true) {
    super(seedAddresses, tls);
  }

  /**
   * Creates a new Resolver instance with the specified endpoints.
   * @param {string[]} endpoints - The endpoints to be added to the resolver.
   * @returns {Resolver} A new Resolver instance with the specified endpoints.
   */
  static createWithEndpoints(endpoints: string[]): Resolver {
    const resolver = new Resolver();
    resolver.extendEndpoints = endpoints;
    return resolver;
  }

  override async getNodeEndpoint(networkId: NetworkId): Promise<string> {
    const endpoints = await super.getAllNodeEndpoints(networkId);
    const jsonEndpoints = endpoints.map((url) => url.replace('borsh', 'json'));

    const promises = jsonEndpoints.map(async (endpoint) => {
      return this.testConnection(endpoint)
        .then((reachableEndpoint) => reachableEndpoint)
        .catch(() => null);
    });

    const fastestEndpoint = await Promise.any(promises);
    if (fastestEndpoint === null) {
      throw new Error('No valid endpoint found');
    }

    return fastestEndpoint;
  }

  override async getAllNodeEndpoints(networkId: NetworkId): Promise<string[]> {
    const endpoints = await super.getAllNodeEndpoints(networkId);
    const jsonEndpoints = endpoints.map((url) => url.replace('borsh', 'json'));
    const allEndpoints = [...jsonEndpoints, ...this.extendEndpoints];

    const promises = allEndpoints.map((endpoint) =>
      this.testConnection(endpoint)
    );

    const results = await Promise.allSettled(promises);
    return results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);
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
