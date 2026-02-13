export interface ThreadMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    tool_calls?: any;
    additional_kwargs?: any;
}

export interface ThreadSummary {
    thread_id: string;
    last_activity?: string;
    checkpoint_count?: number;
}

export interface ThreadDetailResponse {
    thread_id: string;
    last_activity?: string;
    messages: ThreadMessage[];
}

export interface ThreadCreateRequest {
    thread_id?: string;
}

export interface ThreadCreateResponse {
    thread_id: string;
}

export interface AskRequest {
    question: string;
    thread_id: string;
}

export interface ChatStreamEvent {
    event: string;
    data: {
        chunk: {
            content: string;
        }
    };
}
