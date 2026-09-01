import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';
import InternalService from './internal-service';
import axios from 'axios';

export class MasterDataService extends InternalService {
  constructor() {
    super(
      process.env.SERVICE_MASTER_DATA_URL ??
        SecretManager.env.SERVICE_MASTER_DATA_URL ??
        'http://'
    );
  }

  /**
   * Retrieves vendor branches based on the provided branch IDs.
   *
   * @param {Array<string>} ids - An array of branch IDs to fetch vendor branches for.
   * @param {string} token - Bearer token for authentication.
   *
   * @returns {Promise<any>} A promise that resolves with the vendor branches data, or null if not found.
   *
   * @throws {Error} Throws an error if the request fails.
   */
  public async getAllBranches(token: string): Promise<any> {
    const params = {
      page: '1',
      limit: '9999',
    };
    this.headers['Authorization'] = token;
    const config = {
      method: 'GET',
      url: `${this.url}/v1/branches`,
      params,
      headers: this.headers,
      timeout: this.timeout,
    };

    const response = await axios.request(config);

    return response?.data?.data ? response.data.data : null;
  }
}
