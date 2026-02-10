# Testing Login Flow

## Prerequisites

1. **Keycloak must be running:**
   ```bash
   docker-compose -f docker-compose.keycloak.yml ps
   ```
   Should show `keycloak` and `keycloak-db` containers running.

2. **Frontend must be running:**
   ```bash
   cd front
   npm start
   ```
   Should be accessible at `http://localhost:4200`

## Test Steps

### Step 1: Access the Application

1. Open browser: `http://localhost:4200`
2. **Expected:** You should be automatically redirected to `/auth/login`

### Step 2: Login Page

1. You should see the login page with:
   - "Welcome to Inventory Orchestrator!" title
   - "Sign In with Keycloak" button
2. **Expected:** Login page displays correctly

### Step 3: Click Sign In

1. Click "Sign In with Keycloak" button
2. **Expected:** 
   - Redirected to Keycloak login page at `http://localhost:8180`
   - Keycloak login form appears

### Step 4: Enter Credentials

**Test Users:**

1. **Admin User:**
   - Username: `admin`
   - Password: `admin123`
   - Role: ADMIN

2. **Manager User:**
   - Username: `manager`
   - Password: `manager123`
   - Role: MANAGER

3. **Regular User:**
   - Username: `user`
   - Password: `user123`
   - Role: USER

### Step 5: After Login

1. **Expected:**
   - Redirected back to `http://localhost:4200`
   - If you had a returnUrl, redirected to that page
   - Otherwise, redirected to dashboard (`/`)
   - Topbar shows your username
   - You can access protected routes

### Step 6: Test Route Protection

1. **Test Admin Routes:**
   - Navigate to `/inventory/upload` (should work for ADMIN)
   - Navigate to `/inventory/settings` (should work for ADMIN)

2. **Test Manager Routes:**
   - Navigate to `/inventory/stock` (should work for ADMIN and MANAGER)
   - Navigate to `/inventory/sales` (should work for ADMIN and MANAGER)

3. **Test User Routes:**
   - Navigate to `/inventory/products` (should work for all authenticated users)
   - Navigate to `/inventory/categories` (should work for all authenticated users)

4. **Test Access Denied:**
   - As USER, try to access `/inventory/upload` → Should redirect to `/auth/access`
   - As MANAGER, try to access `/inventory/settings` → Should redirect to `/auth/access`

### Step 7: Test Logout

1. Click logout button in topbar
2. **Expected:**
   - Redirected to `/auth/login`
   - Session cleared
   - Cannot access protected routes

## Troubleshooting

### Issue: Not Redirected to Login

**Check:**
- Keycloak is running: `docker ps | grep keycloak`
- Frontend is running: Check browser console
- Check browser console for errors

**Fix:**
- Ensure Keycloak is accessible at `http://localhost:8180`
- Check `keycloak.config.ts` has correct URL

### Issue: CORS Error

**Check:**
- Keycloak client has correct redirect URIs:
  - `http://localhost:4200/*`
  - `http://localhost:4200`

**Fix:**
- Go to Keycloak Admin Console
- Navigate to Clients → `inventory-orchestrator-backend`
- Add redirect URIs in "Valid Redirect URIs"
- Add `http://localhost:4200/*` to "Web Origins"

### Issue: Login Redirects Back to Login

**Check:**
- Browser console for errors
- Network tab for failed requests
- Keycloak logs: `docker logs keycloak --tail 50`

**Fix:**
- Clear browser cookies for `localhost:4200` and `localhost:8180`
- Check Keycloak client configuration
- Verify realm is imported correctly

### Issue: Token Not Attached to Requests

**Check:**
- Browser DevTools → Network tab
- Check if `Authorization: Bearer ...` header is present

**Fix:**
- Check HTTP interceptor is working
- Verify Keycloak service is initialized
- Check browser console for errors

## Quick Test Commands

```bash
# Test Keycloak is running
curl http://localhost:8180/realms/inventory-orchestrator/.well-known/openid-configuration

# Test authentication
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"

# Check frontend is running
curl http://localhost:4200
```

## Expected Flow Diagram

```
User visits http://localhost:4200
    ↓
Auth Guard checks authentication
    ↓
Not authenticated → Redirect to /auth/login
    ↓
User clicks "Sign In with Keycloak"
    ↓
Redirect to Keycloak login page
    ↓
User enters credentials
    ↓
Keycloak validates and issues token
    ↓
Redirect back to http://localhost:4200
    ↓
Auth Guard checks → Authenticated ✓
    ↓
Redirect to original URL or dashboard
    ↓
User can access protected routes
```

## Success Criteria

✅ Unauthenticated users are redirected to login  
✅ Login page displays correctly  
✅ Clicking login redirects to Keycloak  
✅ After login, user is redirected back to app  
✅ User can access routes based on their role  
✅ Logout works correctly  
✅ Token is attached to API requests  
