import { createHash, randomUUID } from 'node:crypto';
import { injectable } from 'inversify';
import { sequelize } from '@/utils';
import { RedisCache } from '@/integrations/thrid-party/redis.third';

/** Entri komponen healthcheck — parity respons /healthcheck-sql WMS_Incoming. */
export interface ComponentHealth {
  component: string;
  status: string;
  description: string | null;
  error: string | null;
}

/** Envelope manual untuk status non-2xx — ResponseJson hanya wrap 2xx,
 *  paritas bentuk respons dengan middleware (lihat response-json.middleware.ts). */
export const failureResponse = (entries: unknown[]) => {
  const transactionId = randomUUID();
  return {
    httpCode: 503,
    data: {
      transactionId,
      code: 'SUCCESS-HEALTHCHECK-0001',
      message: 'Service Unhealthy',
      eTag: createHash('md5').update(transactionId).digest('hex'),
      data: entries,
    },
  };
};

@injectable()
export class HealthCheckService {
  async getHealth() {
    return {
      httpCode: 200,
      data: null,
    };
  }

  /** SQL Server — sequelize.authenticate() ≈ healthQuery "SELECT 1;". */
  async checkSql(): Promise<ComponentHealth> {
    try {
      await sequelize.authenticate();
      return { component: 'sqlserver', status: 'Healthy', description: null, error: null };
    } catch (error) {
      return {
        component: 'sqlserver',
        status: 'Unhealthy',
        description: 'Service Unhealthy',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Redis — PING ≈ healthcheck connection. */
  async checkRedis(): Promise<ComponentHealth> {
    try {
      const pong = await RedisCache.getInstance().ping();
      if (pong !== 'PONG') throw new Error(`unexpected reply: ${pong}`);
      return { component: 'redis', status: 'Healthy', description: null, error: null };
    } catch (error) {
      return {
        component: 'redis',
        status: 'Unhealthy',
        description: 'Service Unhealthy',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
