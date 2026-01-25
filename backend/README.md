# Intelligent Inventory Orchestrator Backend

Spring Boot REST API backend for the Intelligent Inventory Orchestrator application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## 🔧 Prerequisites

- **Java 25** JDK (or compatible version)
- **Maven 3.6+**
- **PostgreSQL 12+**
- **IDE** (IntelliJ IDEA, Eclipse, VS Code recommended)

## 🛠 Technology Stack

- **Java**: 25
- **Spring Boot**: 3.5.0
- **Database**: PostgreSQL
- **Build Tool**: Maven
- **Libraries**: 
  - Apache Commons CSV (for CSV processing)
  - Jackson (for JSON processing)
  - Spring Data JPA (for database access)

## 🚀 Quick Start

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE store;
```

Or use the provided SQL script:
```bash
psql -U postgres -f src/main/resources/db/init.sql
```

### 3. Configure Database

Update `src/main/resources/application.properties` with your database credentials:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/store
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 4. Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The API will be available at: `http://localhost:8080/api`

## 🗄 Database Setup

### Option 1: Manual Setup

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE store;

-- Connect to the database
\c store

-- The tables will be created automatically by Hibernate
-- when you run the application with spring.jpa.hibernate.ddl-auto=update
```

### Option 2: Using Docker

```bash
# Start PostgreSQL using Docker Compose
docker-compose up -d

# The database will be created automatically
```

### Database Schema

The application uses JPA/Hibernate with auto-ddl enabled. Tables will be created automatically:

- `store` - Store/Warehouse information
- `product` - Product catalog
- `stock` - Stock levels per store and product
- `sales` - Sales records
- `transfer` - Transfer records between stores
- `file_upload` - File upload tracking
- `file_upload_errors` - File upload error messages

## ⚙️ Configuration

### Application Properties

Key configuration in `src/main/resources/application.properties`:

```properties
# Server
server.port=8080
server.servlet.context-path=/api

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/store
spring.datasource.username=postgres
spring.datasource.password=postgres

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

### Environment Variables

For production, use environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/store
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres
export SERVER_PORT=8080
```

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api
```

### File Upload & Column Mapping

#### Parse CSV Headers
```http
POST /api/files/parse-headers
Content-Type: multipart/form-data

file: <CSV file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "headers": ["id_store", "id_product", "quantity"],
    "rowCount": 100
  },
  "message": "Headers parsed successfully"
}
```

#### Get Required Columns
```http
GET /api/files/required-columns/{fileType}
```

**File Types:** `STOCK`, `SALES`, `TRANSFER`

**Response:**
```json
{
  "success": true,
  "data": {
    "fileType": "STOCK",
    "requiredColumns": ["id_store", "id_product", "quantity"]
  }
}
```

#### Validate File
```http
POST /api/files/validate
Content-Type: multipart/form-data

file: <CSV file>
fileType: STOCK
columnMapping: {"fileType":"STOCK","mappings":[...]}
```

#### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: <CSV file>
fileType: STOCK
columnMapping: {"fileType":"STOCK","mappings":[...]}
```

### Data Retrieval

#### Get All Stocks
```http
GET /api/stocks?storeId=1&productId=2&page=0&size=20
```

#### Get All Sales
```http
GET /api/sales?storeId=1&startDate=2024-01-01&endDate=2024-12-31&page=0&size=20
```

#### Get All Transfers
```http
GET /api/transfers?storeSent=1&storeReceive=2&productId=3
```

#### Get All Products
```http
GET /api/products
```

#### Get Product by ID
```http
GET /api/products/{id}
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/inventory/orchestrator/
│   │   │   ├── entity/          # JPA entities (Store, Product, Stock, Sales, Transfer, FileUpload)
│   │   │   ├── repository/     # JPA repositories
│   │   │   ├── service/        # Business logic
│   │   │   │   ├── CsvProcessingService.java
│   │   │   │   ├── ColumnMappingService.java
│   │   │   │   └── DataImportService.java
│   │   │   ├── controller/     # REST controllers
│   │   │   │   ├── FileController.java
│   │   │   │   ├── StockController.java
│   │   │   │   ├── SalesController.java
│   │   │   │   ├── TransferController.java
│   │   │   │   └── ProductController.java
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   ├── config/         # Configuration classes
│   │   │   ├── exception/      # Exception handlers
│   │   │   └── InventoryOrchestratorApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── db/
│   │           └── init.sql
│   └── test/                    # Test classes
├── pom.xml
├── README.md
├── .gitignore
├── docker-compose.yml
└── SETUP.md
```

## 💻 Development

### Running in Development Mode

```bash
# Run with hot reload (if using Spring Boot DevTools)
mvn spring-boot:run

# Or build and run JAR
mvn clean package
java -jar target/orchestrator-backend-1.0.0.jar
```

### Code Style

- Follow Java naming conventions
- Use meaningful variable and method names
- Add JavaDoc comments for public methods
- Keep methods focused and small

### Database Migrations

The application uses Hibernate's `ddl-auto=update` for development. For production, consider using:
- Flyway
- Liquibase

## 🧪 Testing

### Run Tests

```bash
mvn test
```

### Manual API Testing

Use tools like:
- Postman
- cURL
- HTTPie

Example cURL:

```bash
# Get all products
curl http://localhost:8080/api/products

# Upload a file
curl -X POST http://localhost:8080/api/files/upload \
  -F "file=@stock.csv" \
  -F "fileType=STOCK" \
  -F "columnMapping={\"fileType\":\"STOCK\",\"mappings\":[...]}"
```

## 🚢 Deployment

### Build for Production

```bash
mvn clean package -DskipTests
```

### Run JAR

```bash
java -jar target/orchestrator-backend-1.0.0.jar
```

### Environment-Specific Configuration

Create `application-prod.properties`:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.root=INFO
```

Run with:
```bash
java -jar target/orchestrator-backend-1.0.0.jar --spring.profiles.active=prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t inventory-backend .

# Run container
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/store \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  inventory-backend
```

## 🔐 Security Considerations

- Change default database credentials
- Use environment variables for sensitive data
- Enable HTTPS in production
- Add authentication/authorization (Spring Security)
- Validate and sanitize all inputs
- Implement rate limiting

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials
   - Ensure database exists

2. **Port Already in Use**
   - Change `server.port` in `application.properties`
   - Or kill the process using port 8080

3. **Compilation Errors**
   - Ensure Java 25 is installed
   - Run `mvn clean install`
   - Check IDE Java version settings

## 📝 License

Proprietary - All rights reserved

## 👥 Team Handoff Checklist

- [x] Database schema defined
- [x] API endpoints documented
- [x] Configuration files included
- [x] README with setup instructions
- [x] Database initialization scripts
- [x] Docker Compose for easy setup
- [x] Environment variable examples
- [x] Project structure documented

## 📞 Support

For questions or issues, contact the development team.
