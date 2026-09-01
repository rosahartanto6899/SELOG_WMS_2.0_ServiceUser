import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';

class InternalService {
  protected readonly timeout = 1000 * 10;
  protected url: string;
  protected headers: any = {
    'Content-Type': 'application/json',
  };

  constructor(serviceUrl: string) {
    this.url = serviceUrl;
    if (process.env.IS_NON_CLUSTER) {
      this.headers = {
        ...this.headers,
        'x-api-key': process.env.APIG_KEY ?? SecretManager.env.APIG_KEY ?? '',
      };
      this.url = this._handleUrl(this.url);
    }
  }

  protected _handleUrl(url: string): string {
    const apigUrl = SecretManager.env.APIG_URL ?? '';
    const explodeUrl = url.split('-');
    const serviceName = explodeUrl[2];

    if (!apigUrl) {
      return url;
    }

    return apigUrl.replace('*', serviceName);
  }
}

export default InternalService;
