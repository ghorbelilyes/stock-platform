document.addEventListener('DOMContentLoaded', () => {
    const threadList = document.getElementById('thread-list');
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');

    let currentThreadId = null;

    // Load threads on startup
    fetchThreads();

    // Event Listeners
    newChatBtn.addEventListener('click', createNewThread);
    
    messageInput.addEventListener('input', () => {
        sendBtn.disabled = !messageInput.value.trim() || !currentThreadId;
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    async function fetchThreads() {
        try {
            const res = await fetch('/api/threads');
            if (!res.ok) throw new Error('Failed to fetch threads');
            const threads = await res.json();
            renderThreads(threads);
            
            // Optionally select the most recent thread
            if (threads.length > 0 && !currentThreadId) {
                selectThread(threads[0].thread_id);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function renderThreads(threads) {
        threadList.innerHTML = '';
        threads.forEach(thread => {
            const div = document.createElement('div');
            div.className = `thread-item ${thread.thread_id === currentThreadId ? 'active' : ''}`;
            div.textContent = thread.thread_id.substring(0, 8) + '...';
            div.onclick = () => selectThread(thread.thread_id);
            threadList.appendChild(div);
        });
    }

    async function createNewThread() {
        try {
            const res = await fetch('/api/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) 
            });
            if (!res.ok) throw new Error('Failed to create thread');
            const data = await res.json();
            currentThreadId = data.thread_id;
            
            // Refresh list and select
            await fetchThreads();
            selectThread(currentThreadId);
            chatHistory.innerHTML = '<div class="empty-state">New chat started</div>';
        } catch (err) {
            console.error(err);
        }
    }

    async function selectThread(threadId) {
        currentThreadId = threadId;
        // Update UI active state
        Array.from(threadList.children).forEach(child => {
            child.classList.toggle('active', child.textContent.includes(threadId.substring(0, 8)));
        });
        
        // Enable input if disabled
        messageInput.disabled = false;
        if (messageInput.value.trim()) sendBtn.disabled = false;

        // Fetch history
        try {
            chatHistory.innerHTML = '<div class="empty-state">Loading...</div>';
            const res = await fetch(`/api/threads/${threadId}`);
            if (!res.ok) throw new Error('Failed to load thread');
            const data = await res.json();
            renderMessages(data.messages);
        } catch (err) {
            console.error(err);
            chatHistory.innerHTML = '<div class="empty-state">Error loading messages</div>';
        }
    }

    function renderMessages(messages) {
        chatHistory.innerHTML = '';
        if (!messages || messages.length === 0) {
            chatHistory.innerHTML = '<div class="empty-state">No messages yet</div>';
            return;
        }

        messages.forEach(msg => appendMessage(msg));
        scrollToBottom();
    }

    function appendMessage(msg) {
        const div = document.createElement('div');
        div.className = `message ${msg.role}`;
        
        let content = msg.content;
        if (typeof content === 'object') {
            content = JSON.stringify(content, null, 2);
        }
        
        div.textContent = content;
        chatHistory.appendChild(div);
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !currentThreadId) return;

        // Optimistic UI update
        appendMessage({ role: 'user', content: text });
        messageInput.value = '';
        sendBtn.disabled = true;
        scrollToBottom();

        try {
            const response = await fetch('/api/ask-agentic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: text, thread_id: currentThreadId })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // Create a container for the assistant response
            const assistantDiv = document.createElement('div');
            assistantDiv.className = 'message assistant';
            assistantDiv.textContent = '...';
            chatHistory.appendChild(assistantDiv);
            scrollToBottom();

            let fullText = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                // Parse ndjson
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const event = JSON.parse(line);
                        // Depending on event type, update UI
                        // Assuming standard LangGraph events or just streaming tokens
                        // Ideally we look for 'on_chat_model_stream' or similar logic
                        // For now, let's just append raw content if available or handle specific event types
                        
                        if (event.event === 'on_chat_model_stream') {
                             const token = event.data?.chunk?.content || '';
                             fullText += token;
                             assistantDiv.textContent = fullText;
                        } else if (event.content) {
                            // If we just sent back simple chunks
                             fullText += event.content;
                             assistantDiv.textContent = fullText;
                        }
                        
                         scrollToBottom();
                    } catch (e) {
                        console.warn('Error parsing stream line', e);
                    }
                }
            }
            
            // Final refresh to ensure syncing state (optional)
            // fetchThreads();
        } catch (err) {
            console.error(err);
            appendMessage({ role: 'system', content: 'Error sending message.' });
        }
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
});
