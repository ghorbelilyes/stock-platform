import { Component, ElementRef, OnInit, ViewChild, inject, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { AiAgentService } from '../../shared/services/ai-agent.service';
import { ThreadMessage, ThreadSummary } from '../../shared/models/chat.models';
import { ChatHistoryComponent } from './chat-history.component';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        ButtonModule,
        ProgressSpinnerModule,
        CardModule,
        ChatHistoryComponent
    ],
    template: `
        <div class="chat-page flex h-[calc(100vh-12rem)] shadow-lg rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
            <!-- Sidebar -->
            <app-chat-history 
                class="w-64 flex-shrink-0 hidden md:block"
                [threads]="threads"
                [activeThreadId]="activeThreadId"
                (onSelectThread)="loadThread($event)"
                (onDeleteThread)="deleteThread($event)"
                (onNewChat)="startNewChat()">
            </app-chat-history>

            <!-- Main Chat Area -->
            <div class="flex-1 flex flex-col bg-surface-0 dark:bg-surface-950">
                <!-- Header -->
                <div class="p-4 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center bg-surface-50/50 dark:bg-surface-900/50">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-sparkles text-primary-500 text-xl"></i>
                        <h2 class="m-0 text-lg font-semibold">AI Assistant</h2>
                    </div>
                </div>

                <!-- Messages -->
                <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-4">
                    <div *ngIf="messages.length === 0" class="h-full flex flex-col items-center justify-center text-surface-500 opacity-60">
                        <i class="pi pi-comments text-5xl mb-4"></i>
                        <p>How can I help you with your inventory today?</p>
                    </div>

                    <div *ngFor="let msg of messages" 
                        class="flex" 
                        [ngClass]="{'justify-end': msg.role === 'user', 'justify-start': msg.role === 'assistant'}">
                        
                        <div *ngIf="getDisplayContent(msg.content) || getSources(msg.content).length > 0 || msg.role === 'user'" 
                            [ngClass]="{
                                'bg-primary-500 text-white rounded-br-none': msg.role === 'user',
                                'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-0 rounded-bl-none': msg.role === 'assistant'
                            }" class="max-w-[80%] p-3 rounded-2xl shadow-sm">
                            <div class="text-sm markdown-content" [innerHTML]="renderMarkdown(getDisplayContent(msg.content))"></div>
                            
                            <!-- Sources Section -->
                            <div *ngIf="msg.role === 'assistant' && getSources(msg.content).length > 0" class="mt-3 pt-2 border-t border-surface-200 dark:border-surface-700">
                                <details class="group">
                                    <summary class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 cursor-pointer list-none hover:text-primary-500 transition-colors">
                                        <i class="pi pi-link text-[10px]"></i>
                                        <span>Sources ({{ getSources(msg.content).length }})</span>
                                        <i class="pi pi-chevron-down text-[8px] transition-transform group-open:rotate-180"></i>
                                    </summary>
                                    <div class="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <a *ngFor="let source of getSources(msg.content)" 
                                           [href]="source.href" 
                                           target="_blank" 
                                           class="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 no-underline bg-surface-50 dark:bg-surface-900/50 p-2 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-500 transition-all">
                                            <i class="pi pi-external-link text-[10px]"></i>
                                            <span class="truncate font-medium">{{ source.title || source.href }}</span>
                                        </a>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="isTyping" class="flex justify-start">
                        <div class="bg-surface-100 dark:bg-surface-800 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                            <span class="text-sm">Assistant is thinking</span>
                            <div class="flex gap-1">
                                <span class="dot-typing"></span>
                                <span class="dot-typing" style="animation-delay: 0.2s"></span>
                                <span class="dot-typing" style="animation-delay: 0.4s"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Input -->
                <div class="p-4 border-t border-surface-200 dark:border-surface-700">
                    <form (submit)="sendMessage()" class="flex gap-2">
                        <input 
                            pInputText 
                            [(ngModel)]="userInput" 
                            name="userInput"
                            [disabled]="isTyping"
                            placeholder="Ask about your stock, products, or transfers..." 
                            class="flex-1 rounded-full px-4"
                            autocomplete="off">
                        <p-button 
                            type="submit" 
                            icon="pi pi-send" 
                            [rounded]="true" 
                            [disabled]="!userInput.trim() || isTyping">
                        </p-button>
                    </form>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .dot-typing {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: currentColor;
            animation: dot-pulse 1.5s infinite ease-in-out;
        }
        @keyframes dot-pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        summary::-webkit-details-marker {
            display: none;
        }
        .markdown-content ::ng-deep table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            margin: 1rem 0;
            font-size: 0.85rem;
            border: 1px solid var(--p-surface-200);
            border-radius: 8px;
            overflow: hidden;
            background: var(--p-surface-0);
        }
        .dark .markdown-content ::ng-deep table {
            border-color: var(--p-surface-700);
            background: var(--p-surface-900);
        }
        .markdown-content ::ng-deep th {
            background: var(--p-surface-50);
            color: var(--p-surface-700);
            font-weight: 600;
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid var(--p-surface-200);
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.05em;
        }
        .dark .markdown-content ::ng-deep th {
            background: var(--p-surface-800);
            color: var(--p-surface-300);
            border-color: var(--p-surface-700);
        }
        .markdown-content ::ng-deep td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--p-surface-200);
            color: var(--p-surface-900);
        }
        .dark .markdown-content ::ng-deep td {
            border-color: var(--p-surface-700);
            color: var(--p-surface-0);
        }
        .markdown-content ::ng-deep tr:last-child td {
            border-bottom: none;
        }
        .markdown-content ::ng-deep tr:hover td {
            background: var(--p-surface-50);
        }
        .dark .markdown-content ::ng-deep tr:hover td {
            background: var(--p-surface-800);
        }
        .markdown-content ::ng-deep p {
            margin: 0.5rem 0;
            line-height: 1.5;
        }
        .markdown-content ::ng-deep p:first-child { margin-top: 0; }
        .markdown-content ::ng-deep p:last-child { margin-bottom: 0; }
    `]
})
export class ChatComponent implements OnInit {
    private aiService = inject(AiAgentService);
    private sanitizer = inject(DomSanitizer);

    threads: ThreadSummary[] = [];
    messages: ThreadMessage[] = [];
    activeThreadId: string | null = null;
    userInput: string = '';
    isTyping: boolean = false;

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    ngOnInit() {
        this.loadThreads();
    }

    loadThreads() {
        this.aiService.getThreads().subscribe(threads => {
            this.threads = threads;
            if (!this.activeThreadId && threads.length > 0) {
                // Optionally load the latest thread
                // this.loadThread(threads[0].thread_id);
            }
        });
    }

    loadThread(threadId: string) {
        this.activeThreadId = threadId;
        this.aiService.getThread(threadId).subscribe(detail => {
            // Filter out system messages if any
            this.messages = detail.messages.filter(m => m.role !== 'system' && m.role !== 'tool');
            this.scrollToBottom();
        });
    }

    deleteThread(threadId: string) {
        this.aiService.deleteThread(threadId).subscribe(() => {
            this.threads = this.threads.filter(t => t.thread_id !== threadId);
            if (this.activeThreadId === threadId) {
                this.messages = [];
                this.activeThreadId = null;
            }
        });
    }

    startNewChat() {
        this.aiService.createThread().subscribe(res => {
            this.activeThreadId = res.thread_id;
            this.messages = [];
            this.loadThreads();
        });
    }

    async sendMessage() {
        if (!this.userInput.trim() || this.isTyping) return;

        const userMsg = this.userInput.trim();
        this.userInput = '';

        // Generate thread ID if none
        if (!this.activeThreadId) {
            const res = await this.aiService.createThread().toPromise();
            this.activeThreadId = res?.thread_id || null;
            this.loadThreads();
        }

        if (!this.activeThreadId) return;

        // Add user message to UI
        const userThreadMsg: ThreadMessage = { role: 'user', content: userMsg };
        this.messages.push(userThreadMsg);
        this.scrollToBottom();

        this.isTyping = true;
        const assistantMsg: ThreadMessage = { role: 'assistant', content: '' };
        this.messages.push(assistantMsg);

        try {
            const stream = this.aiService.askAgenticStream(userMsg, this.activeThreadId);
            for await (const chunk of stream) {
                assistantMsg.content += chunk;
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Streaming error:', error);
            assistantMsg.content = 'Sorry, I encountered an error. Please try again.';
        } finally {
            this.isTyping = false;
            this.loadThreads(); // Update last activity
            this.scrollToBottom();
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            if (this.scrollContainer) {
                const el = this.scrollContainer.nativeElement;
                el.scrollTop = el.scrollHeight;
            }
        }, 50);
    }

    getDisplayContent(content: string): string {
        if (!content) return '';
        const boundary = this.getJsonBoundary(content);
        if (boundary !== -1) {
            return content.substring(boundary).trim();
        }
        // If it starts like JSON but hasn't closed yet, it's still streaming the prefix
        if (content.startsWith('[') || content.startsWith('{')) {
            return '';
        }
        return content;
    }

    renderMarkdown(content: string): SafeHtml {
        if (!content) return '';
        const rawHtml = marked.parse(content) as string;
        return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
    }

    getSources(content: string): any[] {
        if (!content) return [];
        const boundary = this.getJsonBoundary(content);
        if (boundary === -1) return [];

        try {
            const jsonStr = content.substring(0, boundary);
            const parsed = JSON.parse(jsonStr);
            // Only return if it looks like the search results array
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].href) {
                return parsed;
            }
            return [];
        } catch (e) {
            return [];
        }
    }

    private getJsonBoundary(content: string): number {
        if (!content || (content[0] !== '[' && content[0] !== '{')) return -1;

        let stack = 0;
        let inString = false;
        let escape = false;

        for (let i = 0; i < content.length; i++) {
            const char = content[i];

            if (escape) {
                escape = false;
                continue;
            }
            if (char === '\\') {
                escape = true;
                continue;
            }
            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === '[' || char === '{') stack++;
                else if (char === ']' || char === '}') {
                    stack--;
                    if (stack === 0) return i + 1;
                }
            }
        }
        return -1;
    }
}
