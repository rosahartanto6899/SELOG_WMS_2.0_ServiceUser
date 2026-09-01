import 'reflect-metadata';
import 'dotenv/config';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import retry from 'async-retry';
import moment from 'moment-timezone';
import compression from 'compression';
import * as bodyParser from 'body-parser';
import { container } from '@/shared-libs/utils';
import { InversifyExpressServer } from 'inversify-express-utils';
import { HandlerException } from '@/shared-libs/exceptions/handler.exception';
import {
  VerifyJWT,
  ResponseJson,
  validateDataMiddleware,
  JsonValidationMiddleware,
} from '@/shared-libs/middlewares';

moment.tz.setDefault('Asia/Jakarta');

export async function Bootstrap() {
  const server = new InversifyExpressServer(container);
  server.setConfig((app) => {
    app.use(compression());
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    app.use(bodyParser.json());
    app.use(helmet());
    app.use(cors());
    app.use(VerifyJWT);
    app.use(validateDataMiddleware);
    app.use(ResponseJson);
    app.use(morgan('dev'));
  });

  server.setErrorConfig((app) => {
    app.use(JsonValidationMiddleware);
    app.use(HandlerException);
  });

  const serverInstance = server.build();

  await retry(
    async (bail) => {
      try {
        console.log(`server running port: ${process.env.PORT || 3000}`);
        serverInstance.listen(process.env.PORT || 3000);
      } catch (err) {
        if (err instanceof Error) {
          bail(err);
        } else {
          console.log('Unknown error occurred');
        }
      }
    },
    {
      retries: 10,
      minTimeout: 5000,
    }
  ).catch((error) => console.log(error));
}
