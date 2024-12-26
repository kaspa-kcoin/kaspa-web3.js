import { NetworkId } from '../../consensus';
import { BorshResolver } from './borsh-resolver.ts';

class JsonResolver {
  private borshResolver: BorshResolver;

  constructor(resolver: BorshResolver) {
    this.borshResolver = resolver;
  }

  async getJsonUrl(networkId: NetworkId): Promise<string> {
    const urls = await this.borshResolver.getAllUrls(networkId);
    const jsonUrls = urls.map((url) => url.replace('borsh', 'json'));

    const promises = jsonUrls.map((jsonUrl) => {
      return new Promise<string>((resolve, reject) => {
        const client = new WebSocket(jsonUrl);
        client.onopen = () => {
          client.close();
          resolve(jsonUrl);
        };

        client.onerror = (event) => {
          reject(new Error(`WebSocket error: ${event}`));
        };
      });
    });

    return Promise.any(promises);
  }
}

export { JsonResolver };