# Team Handoff Document

## Project Overview

**Project Name:** Intelligent Inventory Orchestrator Backend  
**Technology:** Spring Boot 3.5.0, Java 25, PostgreSQL  
**Purpose:** REST API backend for multi-store inventory management with AI-driven transfer suggestions

## Quick Start for New Team Members

1. **Read SETUP.md** - Complete setup instructions
2. **Read README.md** - Full documentation
3. **Read API_EXAMPLES.md** - API usage examples
4. **Run docker-compose.yml** - Quick database setup

## Project Status

✅ **Completed:**
- Entity models (Store, Product, Stock, Sales, Transfer, FileUpload)
- JPA repositories
- CSV processing service
- Column mapping system
- File upload with validation
- REST API endpoints
- Database relationships
- Error handling

⚠️ **To Be Implemented:**
- Authentication/Authorization (Spring Security)
- Unit tests
- Integration tests
- API documentation (Swagger/OpenAPI)
- Logging improvements
- Performance optimizations
- Caching (Redis)
- Background job processing

## Architecture

### Layers

1. **Controller Layer** (`controller/`)
   - REST endpoints
   - Request/Response handling
   - Input validation

2. **Service Layer** (`service/`)
   - Business logic
   - Data processing
   - CSV parsing and mapping

3. **Repository Layer** (`repository/`)
   - Database access
   - JPA queries

4. **Entity Layer** (`entity/`)
   - Database models
   - Relationships

5. **DTO Layer** (`dto/`)
   - Data transfer objects
   - API responses

## Key Features

### 1. Dynamic Column Mapping
- CSV files can have different column names
- Users map file columns to backend columns
- Supports STOCK, SALES, and TRANSFER file types

### 2. File Upload & Validation
- CSV file parsing
- Header extraction
- Data validation
- Batch import with error reporting

### 3. Data Management
- Stock levels per store/product
- Sales tracking
- Transfer management
- Product catalog

## Database Schema

### Entities

- **Store**: Stores and warehouses
- **Product**: Product catalog
- **Stock**: Stock levels (composite key: store + product)
- **Sales**: Sales records
- **Transfer**: Inter-store transfers
- **FileUpload**: Upload tracking

### Relationships

- Store 1:N Stock
- Store 1:N Sales
- Store 1:N Transfer (as sender and receiver)
- Product 1:N Stock
- Product 1:N Sales
- Product 1:N Transfer

## API Endpoints

### File Operations
- `POST /api/files/parse-headers` - Parse CSV headers
- `GET /api/files/required-columns/{fileType}` - Get required columns
- `POST /api/files/validate` - Validate file
- `POST /api/files/upload` - Upload and import file

### Data Retrieval
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `GET /api/stocks` - Get stocks (with filters)
- `GET /api/sales` - Get sales (with filters)
- `GET /api/transfers` - Get transfers (with filters)

## Configuration

### Development
- Profile: `dev`
- Database: Auto-create tables
- Logging: DEBUG level
- Hot reload: Enabled

### Production
- Profile: `prod`
- Database: Validate schema only
- Logging: INFO level
- Use environment variables

## Development Guidelines

### Code Style
- Follow Java naming conventions
- Use meaningful names
- Add JavaDoc for public methods
- Keep methods focused

### Git Workflow
- Create feature branches
- Write descriptive commit messages
- Review before merging
- Keep main branch stable

### Testing
- Write unit tests for services
- Write integration tests for controllers
- Test edge cases
- Maintain >80% code coverage

## Dependencies

### Core
- Spring Boot 3.5.0
- Spring Data JPA
- PostgreSQL Driver
- Apache Commons CSV

### Development
- Lombok (optional, not used in current build)
- Spring Boot DevTools

## Environment Setup

### Required
- Java 25 JDK
- Maven 3.6+
- PostgreSQL 12+

### Optional
- Docker & Docker Compose
- IntelliJ IDEA / Eclipse / VS Code
- Postman (for API testing)

## Deployment

### Local
```bash
mvn spring-boot:run
```

### Production
```bash
mvn clean package
java -jar target/orchestrator-backend-1.0.0.jar --spring.profiles.active=prod
```

### Docker
```bash
docker-compose up -d
docker build -t inventory-backend .
docker run -p 8080:8080 inventory-backend
```

## Known Issues

1. **Lombok not working** - Using explicit getters/setters instead
2. **No authentication** - Needs Spring Security implementation
3. **No API documentation** - Consider adding Swagger/OpenAPI
4. **Limited error handling** - Expand error scenarios

## Future Enhancements

1. **Security**
   - JWT authentication
   - Role-based access control
   - API rate limiting

2. **Performance**
   - Redis caching
   - Database query optimization
   - Async processing

3. **Monitoring**
   - Application metrics (Prometheus)
   - Logging aggregation (ELK stack)
   - Health checks

4. **Testing**
   - Unit test coverage
   - Integration tests
   - Load testing

## Support & Resources

### Documentation
- README.md - Main documentation
- SETUP.md - Setup guide
- API_EXAMPLES.md - API usage examples

### External Resources
- Spring Boot Docs: https://spring.io/projects/spring-boot
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Maven Docs: https://maven.apache.org/guides/

## Contact

For questions or issues:
- Check documentation first
- Review code comments
- Ask team members
- Create issue ticket

## Checklist for New Team Members

- [ ] Read all documentation files
- [ ] Set up development environment
- [ ] Run application successfully
- [ ] Test API endpoints
- [ ] Understand project structure
- [ ] Review entity relationships
- [ ] Understand column mapping feature
- [ ] Set up IDE
- [ ] Clone and build project
- [ ] Run database setup

---

**Last Updated:** 2024-01-21  
**Version:** 1.0.0
