import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';
import { Sequelize } from 'sequelize';

export const sequelize: Sequelize = new Sequelize(
  `${SecretManager.env.SQL_DATABASE_USER}`,
  `${SecretManager.env.SQL_USERNAME_USER}`,
  `${SecretManager.env.SQL_PASSWORD_USER}`,
  {
    host: `${SecretManager.env.SQL_HOST}`,
    dialect: 'mssql',
    timezone: '+07:00',
    pool: {
      max: 200,
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
    logging: false,
  }
);
