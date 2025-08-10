export class HttpRequest {
  public readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  get = async <TRes>(url: string): Promise<TRes> => {
    try {
      const res = await fetch(`${this.baseUrl ?? ''}${url}`, {
        method: 'GET'
      });
      return (await res.json()) as TRes;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}
