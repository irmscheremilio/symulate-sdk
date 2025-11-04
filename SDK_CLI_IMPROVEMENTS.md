# SDK CLI Improvements - Human-Readable Names

## Changes Made

Updated the Symulate SDK CLI to display human-readable organization and project names instead of UUIDs in key commands.

## Updated Commands

### 1. `npx symulate login`

**Before:**
```
[Symulate] ✓ Successfully authenticated as user@example.com
[Symulate] ✓ Auto-selected organization and project
[Symulate]   Organization ID: 123e4567-e89b-12d3-a456-426614174000
[Symulate]   Project ID: 987fbc97-4bed-5078-9f07-9141ba07c9f3
```

**After:**
```
[Symulate] ✓ Successfully authenticated as user@example.com
[Symulate] ✓ Auto-selected organization and project
[Symulate]   Organization: My Company (my-company)
[Symulate]   Project: Production API (production-api)
```

**What it does:**
- Fetches organization name and slug from the database
- Fetches project name and slug from the database
- Displays them in a user-friendly format: `Name (slug)`
- Falls back to UUIDs if fetch fails

### 2. `npx symulate whoami`

**Before:**
```
[Symulate] Current User:
  Email: user@example.com
  User ID: abc-123-def
  Current Organization: My Company (my-company)
    ID: 123e4567-e89b-12d3-a456-426614174000
  Current Project: Production API (production-api)
    ID: 987fbc97-4bed-5078-9f07-9141ba07c9f3
```

**After:**
```
[Symulate] Current User:
  Email: user@example.com
  User ID: abc-123-def
  Current Organization: My Company (my-company)
    ID: 123e4567-e89b-12d3-a456-426614174000
    Your Role: admin
  Current Project: Production API (production-api)
    ID: 987fbc97-4bed-5078-9f07-9141ba07c9f3
```

**What changed:**
- Now displays the user's role in the organization (owner, admin, member, or viewer)
- Fetches role from the `organization_members` table
- Shows role hierarchy information

## Technical Details

### API Calls Added

#### Login Command - Organization with Project
```typescript
// Fetch organization with role
GET /organization_members?select=role,organizations(name,slug)
    &organization_id=eq.{orgId}&user_id=eq.{userId}

// Fetch project
GET /projects?id=eq.{projectId}&select=name,slug
```

#### Whoami Command - Organization with Role
```typescript
// Fetch organization with role
GET /organization_members?select=role,organizations(name,slug)
    &organization_id=eq.{orgId}&user_id=eq.{userId}
```

### Error Handling

Both commands include graceful fallbacks:
- If the API call fails, displays UUIDs instead
- Wrapped in try-catch blocks
- No impact on authentication flow if name fetching fails

### Performance

- Minimal impact: 1-2 additional API calls after login
- Uses existing authentication token
- Responses are small (names and slugs only)
- No caching needed (login is infrequent)

## Benefits

1. **Better UX:** Users see meaningful names instead of cryptic UUIDs
2. **Clearer Context:** Immediately understand which organization/project is active
3. **Role Awareness:** Users know their permissions in the organization
4. **Backwards Compatible:** Falls back to UUIDs if names can't be fetched

## Example Output

### Full Login Flow
```bash
$ npx symulate login

[Symulate] Creating session...
[Symulate] Opening browser for authentication...
[Symulate] Waiting for authentication...

[Symulate] ✓ Successfully authenticated as developer@techcorp.com
[Symulate] ✓ Auto-selected organization and project
[Symulate]   Organization: TechCorp Inc (techcorp)
[Symulate]   Project: Mobile App Backend (mobile-backend)

[Symulate] 💡 Tip: You can switch organizations or projects anytime:
[Symulate]   • npx symulate orgs list
[Symulate]   • npx symulate projects list
```

### Full Whoami Output
```bash
$ npx symulate whoami

[Symulate] Current User:
  Email: developer@techcorp.com
  User ID: user_abc123xyz
  Current Organization: TechCorp Inc (techcorp)
    ID: 123e4567-e89b-12d3-a456-426614174000
    Your Role: admin
  Current Project: Mobile App Backend (mobile-backend)
    ID: 987fbc97-4bed-5078-9f07-9141ba07c9f3
  Expires: 12/25/2024, 11:59:59 PM
```

## Files Modified

- `src/auth.ts`
  - `login()` function - Lines 340-447
  - `whoami()` function - Lines 474-512

## Testing

To test these changes:

1. **Login command:**
   ```bash
   npx symulate logout
   npx symulate login
   # Should show organization and project names
   ```

2. **Whoami command:**
   ```bash
   npx symulate whoami
   # Should show organization name and your role
   ```

3. **Edge cases:**
   - Login with no organizations (should handle gracefully)
   - Login with org but no projects (should handle gracefully)
   - API failure during name fetch (should fall back to UUIDs)

## Future Enhancements

Potential improvements:
- Cache organization/project names to avoid repeated API calls
- Show role in the login output as well
- Add color coding for different roles
- Display organization avatar/icon if available
- Show project description in whoami output
