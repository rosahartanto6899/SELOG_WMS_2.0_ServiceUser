import { HTTP_STATUS } from '@/shared-libs';
import { injectable } from 'inversify';

@injectable()
export class HealthCheckService {
  async getHealth() {
    return {
      httpCode: HTTP_STATUS.OK
    };
  }
}
