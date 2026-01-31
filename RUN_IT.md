# How to Run the Application

## Option A: Run everything with Docker (easiest)

From the project root (`fjm/`):

```bash
docker-compose up --build
```

Then open:

- **Frontend:** http://localhost:4200  
- **Backend API:** http://localhost:8080/api  
- **Swagger UI:** http://localhost:8080/api/swagger-ui  

The AI Chat API is part of the backend. No extra steps.

---

## Option B: Run backend only (Docker)

```bash
docker-compose -f docker-compose.backend.yml up --build
```

This starts PostgreSQL (port 5433) and the Spring Boot backend (port 8080).

- **Backend:** http://localhost:8080/api  
- **Swagger:** http://localhost:8080/api/swagger-ui  

---

## Option C: Run backend on your machine (no Docker)

You need:

1. **PostgreSQL** running (port 5432 or 5433).
2. A database named `store`:

   ```bash
   psql -U postgres -c "CREATE DATABASE store;"
   ```

3. In `backend/src/main/resources/application.properties`, set:

   - `spring.datasource.url=jdbc:postgresql://localhost:5432/store`  
     (use `5433` if PostgreSQL is on 5433)
   - `spring.datasource.username=postgres`
   - `spring.datasource.password=postgres`

4. Start the backend:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

Backend will be at http://localhost:8080/api .

---

## Try the AI Chat API

Once the backend is running (any option above):

1. **Swagger:**  
   Open **http://localhost:8080/api/swagger-ui.html** (or http://localhost:8080/api/swagger-ui).  
   On the page, find the **"AI Chat"** tag (near the top). Click it to expand.  
   Use **POST /ai/chat** → **Try it out** → Body: `{ "message": "suggest transfers" }` → **Execute**.

2. **curl:**

   ```bash
   curl -X POST http://localhost:8080/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "balance stock"}'
   ```

3. **Response** will look like:

   ```json
   {
     "success": true,
     "data": {
       "summary": "...",
       "analysis": "...",
       "proposals": [ { "fromStoreId", "toStoreId", "productId", "quantity", "reason", "confidence" } ]
     }
   }
   ```

**Optional – use an LLM for explanations:**  
Set in `application.properties` (or env):

- `app.ai.llm.endpoint=https://api.openai.com/v1/chat/completions`
- `app.ai.llm.api-key=your-openai-api-key`

If these are empty, the agent still runs (deterministic analysis and proposals; explanations are non-LLM).

---

## Run frontend on your machine

If the backend is already running (Docker or local):

```bash
cd front
npm install
npm start
```

Frontend: http://localhost:4200  
It will call the API at http://localhost:8080/api (adjust proxy if your backend is elsewhere).
