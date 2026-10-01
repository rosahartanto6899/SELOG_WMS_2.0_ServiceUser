import {
  BaseHttpController,
  controller,
  httpGet,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { HealthCheckService } from './query.service';
import { failureResponse } from './query.service';

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

  /**
   * @swagger
   * /v1/health/sql:
   *   get:
   *     summary: SQL Server health check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: SQL Server is healthy
   *       503:
   *         description: SQL Server is unhealthy
   */
  @httpGet('/sql')
  async sql() {
    const entry = await this.healthCheckService.checkSql();
    if (entry.status === 'Unhealthy') return failureResponse([entry]);
    return { httpCode: 200, data: [entry] };
  }

  /**
   * @swagger
   * /v1/health/redis:
   *   get:
   *     summary: Redis health check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Redis is healthy
   *       503:
   *         description: Redis is unhealthy
   */
  @httpGet('/redis')
  async redis() {
    const entry = await this.healthCheckService.checkRedis();
    if (entry.status === 'Unhealthy') return failureResponse([entry]);
    return { httpCode: 200, data: [entry] };
  }
}
