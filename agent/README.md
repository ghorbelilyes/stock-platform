# Agent Module Documentation

This module implements an intelligent agent using LangGraph and LangChain, integrated with a FastAPI backend and a static frontend for real-time interaction.

## Overview

The agent is designed to handle complex queries by leveraging a ReAct pattern (Reasoning + Acting). It uses Google's Gemini models for reasoning and can be extended with various tools.

### Key Components

- **`agent/main.py`**: The entry point for the FastAPI application. It sets up the server, middleware, and mounts routers.
- **`agent/routers/chat.py`**: Handles chat-related API endpoints:
    - `POST /api/threads`: Creates a new conversation thread.
    - `GET /api/threads`: Lists existing threads.
    - `GET /api/threads/{thread_id}`: Retrieves message history for a thread.
    - `POST /api/ask-agentic`: Streams the agent's response for a user query.
- **`agent/react/react.py`**: Contains the `AgenticRAG` class which initializes the LangGraph agent and memory.
- **`agent/store/langchain_store.py`**: Manages the Postgres connection for persistent memory (checkpoints).
- **`agent/static/`**: Contains the web interface (HTML/CSS/JS) for interacting with the agent.

## Setup & Usage

1.  **Environment Variables**: Ensure your `.env` file or environment variables are set, especially:
    - `DATABASE_URL`: Connection string for the Postgres database.
    - `GEMINI_API_KEY`: API key for Google Gemini.
    - `GEMINI_MODEL`: Model name (e.g., `gemini/gemini-2.5-pro`).

2.  **Running the Server**:
    To start the development server, run:
    ```bash
    fastapi dev agent/main.py
    ```
    Or using uvicorn directly:
    ```bash
    uvicorn agent.main:app --reload
    ```

3.  **Accessing the Chat Interface**:
    Open your browser and navigate to:
    `http://localhost:8000/chat/`

## Features

- **Persistent Threads**: Conversations are saved in a Postgres database, allowing users to resume chats.
- **Streaming Responses**: The agent streams tokens in real-time for a responsive user experience.
- **Tool Integration**: The agent can be equipped with custom tools (defined in `agent/react/tools/`).
- **Memory**: Uses LangGraph checkpoints to maintain conversation state.

## Directory Structure

```
agent/
├── classes/       # Pydantic models for API requests/responses
├── configs/       # Configuration management
├── react/         # Agent logic and tools
├── routers/       # API route definitions
├── static/        # Frontend assets
├── store/         # Database persistence logic
├── main.py        # Application entry point
└── README.md      # This file
```


docker run -d --name pgdb -e POSTGRES_USER=secret -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stock -p 5432:5432 postgres

change this to the correct datbase name 

DATABASE_ENDPOINT = _EnvironmentVariable(
    "DATABASE_URL",
    str,
    "postgres://secret:secret@172.17.0.2:5432/stock?sslmode=disable"
)