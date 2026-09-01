import {
  BaseHttpController,
  controller,
  httpGet,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { HealthCheckService } from './health-check.service';

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Health check endpoints
 */
@controller('/v1/health')
export class HealthController extends BaseHttpController {
  constructor(
    @inject(HealthCheckService)
    private readonly healthCheckService: HealthCheckService
  ) {
    super();
  }

  /**
   * @swagger
   * /v1/health:
   *   get:
   *     summary: Health check
   *     description: Check the health of the service
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  @httpGet('/')
  async health() {
    return await this.healthCheckService.getHealth();
  }
}
