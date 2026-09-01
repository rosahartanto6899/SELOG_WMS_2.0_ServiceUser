# Commit Message Format Guidelines

## Standard Format

```
ver:1.0.0 tkt:{ticketNumber} msg:{message}
```

## Parameters

### `ver`

- Version identifier for the commit
- Format: `1.0.0` (semantic versioning)
- Version should be incremented based on the nature of changes (major, minor, patch)
- Current version is tracked in Tag in the repository

### `tkt`

- **Ticket number** extracted from the current branch name
- **Example**: For branch `feature/WMS-1234-lorem-ipsum`, use `tkt:WMS-1234`
- **Example**: For branch `bugfix/WMS-5678-lorem-ipsum`, use `tkt:WMS-5678`

### `msg`

- **Brief summary** of the changes made in the commit
- Keep it concise and descriptive
- Use present tense (e.g., "Add user validation", "Fix authentication bug")

## Complete Example

```
ver:1.0.0 tkt:WMS-1234 msg:Add JWT authentication middleware

- Implement token validation middleware
- Add Redis-based token blacklisting
- Update user access validation logic
- Add comprehensive error handling for auth failures
```

## Best Practices

- ✅ Always include additional details in the commit body
- ✅ Use present tense for the message
- ✅ Keep the summary line under 64 characters
- ✅ Separate summary from body with a blank line
- ✅ Use bullet points for multiple changes in the body
