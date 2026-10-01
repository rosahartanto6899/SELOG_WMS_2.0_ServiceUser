import assert from 'assert';
import axios from 'axios';
import { MasterDataService } from '@/integrations/api/master-data-service.api';

/**
 * getAllBranches harus lewat outbound pipeline shared-libs: transient
 * (5xx/network) di-retry max 2x exponential backoff, non-transient tidak.
 * Stub di level axios.request — titik masuk executeOutboundRequest.
 */
describe('MasterDataService.getAllBranches (outbound pipeline)', () => {
  const originalRequest = axios.request.bind(axios);

  afterEach(() => {
    (axios as any).request = originalRequest;
  });

  /** Stub axios.request: per call konsumsi satu status; <400 = sukses. */
  function stubStatuses(statuses: number[]): () => number {
    let calls = 0;
    (axios as any).request = async (config: any) => {
      const status = statuses[Math.min(calls, statuses.length - 1)];
      calls += 1;
      if (status >= 400) {
        const error: any = new Error(`HTTP ${status}`);
        error.isAxiosError = true;
        error.config = config;
        error.response = {
          status,
          data: { message: 'boom' },
          headers: {},
          config,
        };
        throw error;
      }
      return {
        data: { data: [{ id: 'branch-1' }] },
        status,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    return () => calls;
  }

  it('transient 503 di-retry lalu sukses (total 3 attempt)', async () => {
    const calls = stubStatuses([503, 503, 200]);
    process.env.SERVICE_MASTER_DATA_URL = 'http://master-data';
    const service = new MasterDataService();

    const result = await service.getAllBranches('Bearer token');

    assert.deepStrictEqual(result, [{ id: 'branch-1' }]);
    assert.strictEqual(calls(), 3);
  });

  it('400 tidak di-retry (1 attempt, tetap throw)', async () => {
    const calls = stubStatuses([400]);
    process.env.SERVICE_MASTER_DATA_URL = 'http://master-data';
    const service = new MasterDataService();

    await assert.rejects(() => service.getAllBranches('Bearer token'));
    assert.strictEqual(calls(), 1);
  });

  it('retry habis pada 503 terus-menerus: throw setelah 3 attempt', async () => {
    const calls = stubStatuses([503]);
    process.env.SERVICE_MASTER_DATA_URL = 'http://master-data';
    const service = new MasterDataService();

    await assert.rejects(() => service.getAllBranches('Bearer token'));
    assert.strictEqual(calls(), 3);
  });
});
