# AI Chat Logic – Guide for AI Assistants

This document describes how the **AI Chat** feature works in this project so that any AI (or developer) can understand the flow, APIs, and behavior without guessing.

---

## 1. Overview

- **Purpose:** The chat lets users talk to an AI agent that can suggest inventory transfers, explain low stock, explain proposals, simulate transfers, or answer general questions. **The AI never modifies stock directly.** It only creates **transfer proposals**; a human must accept a proposal to create an actual transfer and update stock.
- **Stack:** Spring Boot backend (Java), Angular frontend. Chat UI is at `/inventory/chat`; backend API is `POST /api/ai/chat`.

---

## 2. Request / Response Contract

### Chat API

- **Endpoint:** `POST /api/ai/chat`
- **Request body:**
  ```json
  { "message": "string (required, non-blank)" }
  ```
- **Response:** Wrapped in the app’s standard `ApiResponse<T>`:
  ```json
  {
    "success": true,
    "data": {
      "summary": "string",
      "analysis": "string",
      "proposals": [ { "id?", "fromStoreId", "toStoreId", "productId", "quantity", "reason", "confidence", "status?" } ]
    },
    "message": "OK"
  }
  ```
- **Meaning of fields:**
  - `summary`: Short user-facing summary (e.g. “Generated 3 transfer proposal(s). Review and accept to execute.”).
  - `analysis`: Longer explanation or LLM-generated text.
  - `proposals`: List of transfer proposal DTOs; may be empty. Each has `fromStoreId`, `toStoreId`, `productId`, `quantity`, `reason`, `confidence`; `id` and `status` are set when the proposal is persisted (e.g. `PROPOSED`, `ACCEPTED`, `REJECTED`).

The backend **never** creates a `Transfer` or changes `Stock` from the chat endpoint; it only creates/returns `TransferProposal` records. Execution happens only when the user calls the **transfer-proposals accept** API.

---

## 3. Backend Flow (High Level)

1. **Controller:** `AiChatController` receives `POST /api/ai/chat` with `AiChatRequest { message }`, calls `AiOrchestratorService.process(message)`, returns `AiChatResponse` inside `ApiResponse`.
2. **Intent:** `IntentDetectionService.detect(message)` returns one of: `BALANCE_STOCK`, `SUGGEST_TRANSFERS`, `EXPLAIN_STORE_LOW`, `EXPLAIN_PROPOSAL`, `SIMULATE_TRANSFER`, `UNKNOWN`.
3. **Orchestrator:** `AiOrchestratorService` switches on intent and delegates to the right handler. All handlers return `AiChatResponse(summary, analysis, proposals)`.
4. **Stock analysis:** Deterministic, no LLM. `StockAnalysisService` uses last 30 days sales and store lead time to compute `minQty`, `maxQty`, and status `LOW` / `OK` / `EXCESS`. Used to find low positions and excess sources.
5. **Proposals:** Built from low-stock positions and excess (warehouses first, then stores). Allocated per (fromStore, product) so we never exceed available. Only for intents that “suggest” or “simulate” are proposals created (and for suggest, they are persisted via `TransferProposalService.create`).
6. **LLM:** Used only for natural language: explanations (e.g. “why is store X low”, “explain proposal N”) and for `UNKNOWN` (general chat). `LlmClient` supports OpenAI/Azure and Google Gemini; config via `app.ai.llm.endpoint`, `app.ai.llm.api-key`, `app.ai.llm.model`. If LLM is not configured or fails, the backend returns safe fallback text and no hallucinated data.

---

## 4. Intent Detection (Keyword / Pattern)

- **BALANCE_STOCK:** message contains both “balance” and “stock”.
- **SUGGEST_TRANSFERS:** “suggest” + “transfer”, or “transfer” + (“suggest” or “propose”), or message contains “stock” / “transfer” / “imbalance” (catch-all for transfer suggestions).
- **EXPLAIN_STORE_LOW:** Regex matches e.g. “why is store 5 low”, “store 5 low”, “low store 5”. Store ID is extracted with `extractStoreIdFromMessage`.
- **EXPLAIN_PROPOSAL:** Regex matches e.g. “explain proposal 12”, “proposal 12”. Proposal ID is extracted with `extractProposalIdFromMessage`.
- **SIMULATE_TRANSFER:** “simulate” and “transfer”.
- **UNKNOWN:** Otherwise; handled as general chat (LLM + friendly fallback).

---

## 5. Orchestrator Behavior by Intent

| Intent | Behavior |
|--------|----------|
| **BALANCE_STOCK / SUGGEST_TRANSFERS** | Build proposals from stock analysis (low → excess, warehouses preferred). Persist each via `TransferProposalService.create`. Return summary + analysis (optionally LLM) + list of created proposal views. |
| **EXPLAIN_STORE_LOW** | Resolve store ID from message; validate store exists; get low-stock analysis for that store; optionally ask LLM to explain; return summary + explanation, no proposals. |
| **EXPLAIN_PROPOSAL** | Resolve proposal ID; load proposal; optionally ask LLM to explain; return summary + explanation + single proposal in list. |
| **SIMULATE_TRANSFER** | Same proposal-building logic as suggest, but **do not persist**. Return summary + analysis + proposal list (in-memory only). |
| **UNKNOWN** | Call LLM with system prompt (inventory assistant, concise, can mention “suggest transfers”, “balance stock”, “explain proposal N”). Return summary = analysis = reply (or fallback if LLM unavailable). |

Proposal building (used for suggest and simulate):

- Get all low-stock positions. For each (store, product) with `neededQty > 0`, find excess sources (same product): warehouses first, then stores. Allocate from excess without exceeding available; track allocated per (fromStore, product). Each proposal has reason (human-readable) and confidence (e.g. higher for warehouse source).

---

## 6. Transfer Proposals (Persistence and Execution)

- **Entity:** `TransferProposal` (id, fromStoreId, toStoreId, productId, quantity, reason, confidence, status, createdAt). Status: `PROPOSED`, `ACCEPTED`, `REJECTED`.
- **Create:** `TransferProposalService.create(fromStoreId, toStoreId, productId, quantity, reason, confidence)` validates: quantity > 0, from ≠ to, sender has enough stock, confidence in [0,1]. Then saves. Used by the orchestrator when handling BALANCE_STOCK / SUGGEST_TRANSFERS.
- **Accept:** `TransferProposalService.accept(proposalId)` loads proposal, checks status is PROPOSED and stock still sufficient, then: (1) `stockService.applyTransfer(...)` updates stock, (2) creates a `Transfer` record, (3) sets proposal status to ACCEPTED. Exposed as `POST /api/transfer-proposals/{id}/accept`.
- **Reject:** `TransferProposalService.reject(proposalId)` sets status to REJECTED. Exposed as `POST /api/transfer-proposals/{id}/reject`.

So: **chat only creates/returns proposals; actual stock movement happens only via accept.**

---

## 7. Stock Analysis (Deterministic)

- **Source:** `StockAnalysisService`: for each (store, product) it gets current quantity and average daily sales (last 30 days). Lead time comes from `Store.leadTimeDays` (default 1).
- **Formulas:** `minQty = avgDailySales * leadTimeDays`, `maxQty = minQty * 2`. Then: `quantity < minQty` → LOW (neededQty = minQty - quantity); `quantity > maxQty` → EXCESS (excessQty = quantity - maxQty); else OK.
- **Methods used by orchestrator:** `getLowStocks()`, `getExcessWarehousesForProduct(productId)`, `getExcessStoresForProduct(productId)`, and for “explain store low” the full `analyzeAll()` filtered by store and LOW.

---

## 8. LLM Usage

- **LlmClient** is used for: (1) explaining store low / proposal (with context + user question), (2) general chat (UNKNOWN intent). It **never** receives or returns structured inventory data that could be hallucinated; numbers come only from the backend.
- **Config:** `app.ai.llm.endpoint`, `app.ai.llm.api-key`, `app.ai.llm.model`. If endpoint/key are missing or request fails, methods return null and the orchestrator uses fallback text (e.g. “set app.ai.llm.endpoint and app.ai.llm.api-key in application.properties” or “Analysis is based on current stock levels…”).
- **Gemini:** If endpoint contains `generativelanguage.googleapis.com`, the client uses Gemini-style request (API key in query, system prompt prepended to user message in `contents`). OpenAI/Azure use JSON with `messages` and Bearer token.

---

## 9. Frontend

- **Route:** `/inventory/chat` loads the chat page (lazy route in `inventory.routes.ts`).
- **Service:** `AiAgentService.chat(message)` POSTs `{ message }` to `{API_CONFIG.baseUrl}/ai/chat`, unwraps `data` from `ApiResponse`, returns `Observable<AiChatResponse | null>`. On error it returns `null`.
- **UI:** Chat component shows a message list (user / assistant). Assistant messages can include `res.summary` or `res.analysis` as text and `res.proposals` in a table. For proposals with `id` and `status === 'PROPOSED'`, the UI can show an “Accept” button; accepting should call `POST /api/transfer-proposals/{id}/accept` (and optionally refresh proposals or chat state). Translation keys live under `chat.*` and `navigation.chat` in `assets/i18n/*.json`.

---

## 10. Key Files (Reference)

| Layer | File | Role |
|-------|------|------|
| API | `controller/AiChatController.java` | POST /ai/chat → AiOrchestratorService.process |
| API | `controller/TransferProposalController.java` | GET /transfer-proposals, GET /{id}, POST /{id}/accept, POST /{id}/reject |
| Orchestrator | `ai/AiOrchestratorService.java` | Intent switch, suggest/explain/simulate/unknown |
| Intent | `ai/IntentDetectionService.java` | detect(message), extractStoreIdFromMessage, extractProposalIdFromMessage |
| Intent | `ai/IntentType.java` | BALANCE_STOCK, SUGGEST_TRANSFERS, EXPLAIN_STORE_LOW, EXPLAIN_PROPOSAL, SIMULATE_TRANSFER, UNKNOWN |
| Stock analysis | `ai/StockAnalysisService.java` | analyze, getLowStocks, getExcessWarehousesForProduct, getExcessStoresForProduct |
| Stock analysis | `ai/StockAnalysisResult.java`, `ai/StockStatus.java` | Result DTO and LOW/OK/EXCESS |
| LLM | `ai/LlmClient.java` | chat(systemPrompt, userMessage), explain(context, question); OpenAI + Gemini |
| Proposals | `service/TransferProposalService.java` | create, accept, reject, toView |
| Entities | `entity/TransferProposal.java` | JPA entity; status PROPOSED/ACCEPTED/REJECTED |
| DTOs | `dto/ai/AiChatRequest.java`, `dto/ai/AiChatResponse.java`, `dto/ai/TransferProposalView.java` | Request/response and proposal view |
| Frontend | `shared/services/ai-agent.service.ts` | chat(message) → POST /api/ai/chat |
| Frontend | `pages/inventory/chat/chat.component.ts` | Chat UI, message list, proposals table, accept button |

---

## 11. Rules for AI Assistants

- **Do not** assume the chat API creates transfers or updates stock; it only creates/returns proposals.
- **Do not** invent new intents; only the ones listed in `IntentType` and detected by `IntentDetectionService` are supported.
- **Do not** assume LLM is always available; always document or handle fallback when endpoint/key are missing or the call fails.
- **Accept** of a proposal must go to `POST /api/transfer-proposals/{id}/accept`, not to the chat API.
- **Proposals** in the response may have no `id` when they are from SIMULATE_TRANSFER (not persisted); only persisted proposals (from suggest/balance) have `id` and `status` and can be accepted.

This file is the single source of truth for how the AI chat logic works in this project.
