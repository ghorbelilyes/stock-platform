# API Permissions Reference

This document lists all API endpoints and their required permissions/roles.

## Permission Levels

- **ADMIN**: Full access to all endpoints
- **MANAGER**: Access to transfers, stocks, sales, stores (read-only)
- **USER**: Basic authenticated user access (products, categories read, transfer suggestions read)
- **Unauthenticated**: No access (except public endpoints)

## API Endpoints and Permissions

### 🔴 ADMIN ONLY Endpoints

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/files/**` | ALL | `ROLE_ADMIN` | All file upload, validation, and import operations |
| `/api/files/parse-headers` | POST | `ROLE_ADMIN` | Parse CSV headers |
| `/api/files/required-columns/{fileType}` | GET | `ROLE_ADMIN` | Get required columns for file type |
| `/api/files/validate` | POST | `ROLE_ADMIN` | Validate CSV file |
| `/api/files/upload` | POST | `ROLE_ADMIN` | Upload and import CSV file |
| `/api/files/validate-consistency` | POST | `ROLE_ADMIN` | Validate stock consistency |
| `/api/files/check-database-consistency` | GET | `ROLE_ADMIN` | Check database consistency |
| `/api/transfers/suggestions/approve` | POST | `ROLE_ADMIN` | Approve transfer suggestion (create transfer) |
| `/api/admin/audit-logs` | GET | `ROLE_ADMIN` | Query audit logs |
| `/api/admin/audit-logs/{id}` | GET | `ROLE_ADMIN` | Get audit log by ID |
| `/api/admin/users` | GET, POST | `ROLE_ADMIN` | List/create users |
| `/api/admin/users/{userId}/enabled` | PUT | `ROLE_ADMIN` | Enable/disable user |
| `/api/admin/users/{userId}/roles` | POST, DELETE | `ROLE_ADMIN` | Assign/remove roles |
| `/api/admin/users/search` | GET | `ROLE_ADMIN` | Search users |
| `/api/categories` | POST | `ROLE_ADMIN` | Create category |
| `/api/categories/{id}` | PUT, DELETE | `ROLE_ADMIN` | Update/delete category |

### 🟡 ADMIN + MANAGER Endpoints

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/transfers` | GET | `ROLE_ADMIN` or `ROLE_MANAGER` | Get all transfers (with filters) |
| `/api/stocks` | GET | `ROLE_ADMIN` or `ROLE_MANAGER` | Get all stocks (with filters) |
| `/api/stocks/store/{storeId}` | GET | `ROLE_ADMIN` or `ROLE_MANAGER` | Get stocks by store |
| `/api/stocks/product/{productId}` | GET | `ROLE_ADMIN` or `ROLE_MANAGER` | Get stocks by product |
| `/api/sales` | GET | `ROLE_ADMIN` or `ROLE_MANAGER` | Get all sales (with filters) |
| `/api/stores` | GET | `ROLE_ADMIN` or `ROLE_MANAGER` | Get all stores (with filters) |
| `/api/stores/{id}` | GET | `ROLE_ADMIN` or `ROLE_MANAGER` | Get store by ID |

### 🟢 ALL AUTHENTICATED USERS

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/products` | GET | `isAuthenticated()` | Get all products (with filters) |
| `/api/products/{id}` | GET | `isAuthenticated()` | Get product by ID |
| `/api/products` | POST | `isAuthenticated()` | Create product |
| `/api/products/{id}` | PUT, DELETE | `isAuthenticated()` | Update/delete product |
| `/api/categories` | GET | `isAuthenticated()` | Get all categories |
| `/api/categories/{id}` | GET | `isAuthenticated()` | Get category by ID |
| `/api/categories/{id}/products` | GET | `isAuthenticated()` | Get category with products |
| `/api/transfers/suggestions` | GET | `isAuthenticated()` | Get transfer suggestions (read-only) |

### ⚪ PUBLIC Endpoints (No Authentication)

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/actuator/health` | GET | `permitAll()` | Health check |
| `/swagger-ui/**` | GET | `permitAll()` | Swagger UI |
| `/api-docs/**` | GET | `permitAll()` | API documentation |
| `/v3/api-docs/**` | GET | `permitAll()` | OpenAPI docs |

## Permission Matrix

| Role | Files | Transfers | Stocks | Sales | Products | Categories | Stores | Admin |
|------|-------|-----------|--------|-------|----------|------------|--------|-------|
| **ADMIN** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **MANAGER** | ❌ No | ✅ Read | ✅ Read | ✅ Read | ✅ Full | ✅ Read | ✅ Read | ❌ No |
| **USER** | ❌ No | ✅ Suggestions only | ❌ No | ❌ No | ✅ Full | ✅ Read | ❌ No | ❌ No |
| **Unauthenticated** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

## Detailed Endpoint List

### File Management (`/api/files/**`)
- **Required Role**: `ADMIN`
- **Endpoints**:
  - `POST /api/files/parse-headers` - Parse CSV headers
  - `GET /api/files/required-columns/{fileType}` - Get required columns
  - `POST /api/files/validate` - Validate CSV file
  - `POST /api/files/upload` - Upload and import CSV
  - `POST /api/files/validate-consistency` - Validate stock consistency
  - `GET /api/files/check-database-consistency` - Check DB consistency

### Transfer Management (`/api/transfers/**`)
- **GET /api/transfers**: `ADMIN` or `MANAGER` - List transfers
- **GET /api/transfers/suggestions**: `Authenticated` - View suggestions
- **POST /api/transfers/suggestions/approve**: `ADMIN` - Approve suggestion

### Stock Management (`/api/stocks/**`)
- **Required Role**: `ADMIN` or `MANAGER`
- **Endpoints**:
  - `GET /api/stocks` - List stocks with filters
  - `GET /api/stocks/store/{storeId}` - Get stocks by store
  - `GET /api/stocks/product/{productId}` - Get stocks by product

### Sales Management (`/api/sales/**`)
- **Required Role**: `ADMIN` or `MANAGER`
- **Endpoints**:
  - `GET /api/sales` - List sales with filters

### Product Management (`/api/products/**`)
- **Required Role**: `Authenticated` (any logged-in user)
- **Endpoints**:
  - `GET /api/products` - List products
  - `GET /api/products/{id}` - Get product by ID
  - `POST /api/products` - Create product
  - `PUT /api/products/{id}` - Update product
  - `DELETE /api/products/{id}` - Delete product

### Category Management (`/api/categories/**`)
- **Read Operations**: `Authenticated`
- **Write Operations**: `ADMIN`
- **Endpoints**:
  - `GET /api/categories` - List categories (`Authenticated`)
  - `GET /api/categories/{id}` - Get category (`Authenticated`)
  - `GET /api/categories/{id}/products` - Get category products (`Authenticated`)
  - `POST /api/categories` - Create category (`ADMIN`)
  - `PUT /api/categories/{id}` - Update category (`ADMIN`)
  - `DELETE /api/categories/{id}` - Delete category (`ADMIN`)

### Store Management (`/api/stores/**`)
- **Required Role**: `ADMIN` or `MANAGER`
- **Endpoints**:
  - `GET /api/stores` - List stores
  - `GET /api/stores/{id}` - Get store by ID

### Admin Endpoints (`/api/admin/**`)
- **Required Role**: `ADMIN`
- **Audit Logs**:
  - `GET /api/admin/audit-logs` - Query audit logs
  - `GET /api/admin/audit-logs/{id}` - Get audit log by ID
- **User Management**:
  - `GET /api/admin/users` - List users
  - `POST /api/admin/users` - Create user
  - `GET /api/admin/users/search` - Search users
  - `PUT /api/admin/users/{userId}/enabled` - Enable/disable user
  - `POST /api/admin/users/{userId}/roles` - Assign roles
  - `DELETE /api/admin/users/{userId}/roles` - Remove roles

## HTTP Status Codes

### Authentication Errors

- **401 Unauthorized**: 
  - No token provided
  - Invalid/expired token
  - Token not from Keycloak

- **403 Forbidden**: 
  - Valid token but insufficient role
  - User authenticated but lacks required permission

### Example Responses

**401 Unauthorized (No Token):**
```json
{
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource"
}
```

**403 Forbidden (Insufficient Role):**
```json
{
  "error": "Forbidden",
  "message": "Access Denied"
}
```

## Testing Permissions

### Test with Different Roles

1. **Get Admin Token:**
```bash
curl -X POST http://localhost:8180/realms/inventory-orchestrator/protocol/openid-connect/token \
  -d "client_id=inventory-orchestrator-backend" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password"
```

2. **Test Admin Endpoint:**
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8080/api/files/required-columns/STOCK
# Should work ✅
```

3. **Test with Manager Token:**
```bash
curl -H "Authorization: Bearer <manager_token>" \
  http://localhost:8080/api/files/required-columns/STOCK
# Should return 403 Forbidden ❌
```

4. **Test with User Token:**
```bash
curl -H "Authorization: Bearer <user_token>" \
  http://localhost:8080/api/products
# Should work ✅

curl -H "Authorization: Bearer <user_token>" \
  http://localhost:8080/api/stocks
# Should return 403 Forbidden ❌
```

## Security Notes

1. **All endpoints require authentication** except public endpoints (health, docs)
2. **JWT tokens** must be valid and issued by Keycloak
3. **Roles are extracted** from `realm_access.roles` in JWT
4. **Audit logging** tracks all security-relevant operations
5. **Method-level security** (`@PreAuthorize`) provides fine-grained control

## Role Mapping

Keycloak roles are mapped to Spring Security roles:

| Keycloak Role | Spring Security Role | Access Level |
|---------------|---------------------|--------------|
| `ADMIN` | `ROLE_ADMIN` | Full access |
| `MANAGER` | `ROLE_MANAGER` | Transfers, Stocks, Sales, Stores (read) |
| `USER` | `ROLE_USER` | Products, Categories (read), Suggestions (read) |

## Summary

- ✅ **ADMIN**: Full access to everything
- ✅ **MANAGER**: Read access to transfers, stocks, sales, stores
- ✅ **USER**: Read/write products, read categories, read suggestions
- ❌ **Unauthenticated**: Only public endpoints (health, docs)

All other endpoints require authentication and appropriate roles.
