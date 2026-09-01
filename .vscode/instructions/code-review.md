# 📋 Code Review Checklist – Express.js + TypeScript

## Code Review Checklist

### 🔹 Code Style & Consistency

- [ ] Code follows project naming conventions.
- [ ] ESLint & Prettier run without issues.
- [ ] No usage of `any` unless absolutely necessary.
- [ ] No hardcoded values ("magic numbers/strings").

### 🔹 Project Structure

- [ ] Routes only map controllers, no inline logic.
- [ ] Controllers delegate to services, not repositories directly.
- [ ] Services contain business logic.
- [ ] Repositories handle database access only.
- [ ] Types/interfaces are defined and reused.

### 🔹 Error Handling & Logging

- [ ] Centralized error middleware is used.
- [ ] No raw `console.log` in production code.
- [ ] Responses have consistent structure (status code + message).

### 🔹 Security

- [ ] Sensitive data is not exposed (passwords, tokens, secrets).
- [ ] Input validation is implemented (`zod`, `joi`, or `class-validator`).
- [ ] Async calls have proper error handling.
- [ ] Security middlewares (helmet, rate-limiting, sanitization) are applied where needed.

### 🔹 Testing

- [ ] Unit tests exist for services and utilities.
- [ ] Integration tests exist for major endpoints.
- [ ] External dependencies are mocked in tests.
- [ ] Tests pass locally and in CI.

### 🔹 Performance & Maintainability

- [ ] Database queries are efficient (pagination, indexes if needed).
- [ ] No blocking calls inside request handlers.
- [ ] Large functions (>50 lines) are refactored into smaller ones.

### 🔹 Documentation

- [ ] Swagger/OpenAPI documentation updated (if endpoint changed/added).
- [ ] README or related docs updated if necessary.
- [ ] Code comments added for complex logic.
