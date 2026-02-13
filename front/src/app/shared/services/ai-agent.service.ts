import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map } from 'rxjs';
import {
    ThreadSummary,
    ThreadDetailResponse,
    ThreadCreateResponse,
    AskRequest,
    ChatStreamEvent
} from '../models/chat.models';

@Injectable({
    providedIn: 'root'
})
export class AiAgentService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8000/api';

    getThreads(): Observable<ThreadSummary[]> {
        return this.http.get<ThreadSummary[]>(`${this.apiUrl}/threads`);
    }

    getThread(threadId: string): Observable<ThreadDetailResponse> {
        return this.http.get<ThreadDetailResponse>(`${this.apiUrl}/threads/${threadId}`);
    }

    createThread(threadId?: string): Observable<ThreadCreateResponse> {
        return this.http.post<ThreadCreateResponse>(`${this.apiUrl}/threads`, { thread_id: threadId });
    }

    deleteThread(threadId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/threads/${threadId}`);
    }

    async *askAgenticStream(question: string, threadId: string): AsyncIterable<string> {
        const payload: AskRequest = { question, thread_id: threadId };

        const response = await fetch(`${this.apiUrl}/ask-agentic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('ReadableStream not supported');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const event: ChatStreamEvent = JSON.parse(line);
                    if (event.event === 'on_chat_model_stream') {
                        yield event.data.chunk.content;
                    }
                } catch (e) {
                    console.error('Error parsing NDJSON line:', line, e);
                }
            }
        }
    }
}
