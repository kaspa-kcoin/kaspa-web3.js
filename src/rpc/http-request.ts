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
      const resJson = (await res.json()) as TRes;
      return resJson;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}
