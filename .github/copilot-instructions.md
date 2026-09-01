# GitHub Copilot Instructions for SELOG ServiceUser

## Architecture Overview

This is a TypeScript Node.js microservice built with Express and Inversify DI, featuring:

- **Authentication**: JWT with Redis-backed token blacklisting and user access validation
- **Secret Management**: Azure Key Vault integration via `SecretManager.getInstance()`
- **External Integrations**: Service-to-service communication via Internal Services pattern
- **Database**: Sequelize with MSSQL, hierarchical entity relationships
- **Caching**: Redis singleton with pattern-based operations

## Key Patterns & Conventions

### Controller Pattern

Controllers extend `BaseHttpController` from `inversify-express-utils`:

```typescript
@controller('/v1/users')
export class UserController extends BaseHttpController {
  // Use @httpGet, @httpPost, @httpPut, @httpDelete decorators
  // Apply validation: @httpPost('/', BodyValidation(CreateDto))
}
```

### Service Architecture

- **Command/Query Separation**: Controllers inject separate `CommandService` and `QueryService`
- **External API Integration**: Extend `InternalService` for service-to-service calls
- **Secret Management**: Always use `SecretManager.env.VARIABLE_NAME` for config

### Middleware Stack (Applied Globally)

1. `VerifyJWT` - Token validation with Redis cache lookup
2. `validateUserAccess` - RBAC authorization
3. `validateDataMiddleware` - DTO validation
4. `ResponseJson` - Standardized response formatting

Exception routes bypass JWT: `['/v1/login', '/v1/logout', '/v1/refresh-token']`

### Entity Relationships

Database entities use Sequelize associations defined in `src/database/entities/associations.ts`:

- User → UserRole → Role (many-to-many with branches)
- Menu hierarchical structure with parent/children relations
- Login tracking via LoginAttempt and LoginHistory

### Response Format

All successful responses follow this structure via `ResponseJson` middleware:

```json
{
  "transactionId": "uuid",
  "code": "",
  "message": "OK",
  "eTag": "hash",
  "data": {},
  "pagination": {} // if applicable
}
```

## Development Workflows

### Environment Setup

```bash
npm install
npm run start:dev  # Uses nodemon with tsconfig-paths
```

### Build & Production

```bash
npm run build      # Compiles TS and runs tsc-alias for path mapping
npm run start      # Runs compiled JS with tsconfig-paths-bootstrap
```

### Code Generation

```bash
npm run gen:swag   # Generates Swagger documentation
```

### Testing

```bash
npm run test              # Mocha with tsconfig-paths
npm run test:coverage     # NYC coverage reports
```

## Integration Patterns

### Redis Caching

Use the singleton `RedisCache.getInstance()`:

```typescript
// Token blacklisting pattern
await cache.set(`tokenBlacklist:${token}`, { token }, ttl);
await cache.get(`tokenAccess:${userId}`);
```

### External Service Calls

Extend `InternalService` for authenticated service communication:

```typescript
export class MasterDataService extends InternalService {
  constructor() {
    super(
      process.env.SERVICE_MASTER_DATA_URL ??
        SecretManager.env.SERVICE_MASTER_DATA_URL
    );
  }
  // Automatically handles API Gateway routing and authentication headers
}
```

### Secret Management

Always prioritize environment variables over SecretManager:

```typescript
const url =
  process.env.SERVICE_URL ?? SecretManager.env.SERVICE_URL ?? 'fallback-url';
```

## Path Mapping & Imports

Use `@/` prefix for all internal imports (configured in `tsconfig.json`):

```typescript
import { BodyValidation } from '@/shared-libs/base';
import { CommandService } from '@/features/v1/users/command.service';
```

## Docker & Deployment

Multi-stage Dockerfile optimized for canvas package compilation. Key considerations:

- Build stage installs native dependencies for canvas
- Deploy stage only includes runtime dependencies
- Uses tsconfig-paths-bootstrap for production path resolution
