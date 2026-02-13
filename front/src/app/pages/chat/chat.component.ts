import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
                        
                        <div [ngClass]="{
                            'bg-primary-500 text-white rounded-br-none': msg.role === 'user',
                            'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-0 rounded-bl-none': msg.role === 'assistant'
                        }" class="max-w-[80%] p-3 rounded-2xl shadow-sm">
                            <div class="text-sm whitespace-pre-wrap">{{ msg.content }}</div>
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
    `]
})
export class ChatComponent implements OnInit {
    private aiService = inject(AiAgentService);

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
}
