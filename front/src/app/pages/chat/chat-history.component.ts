import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { ThreadSummary } from '../../shared/models/chat.models';
import { AiAgentService } from '../../shared/services/ai-agent.service';

@Component({
    selector: 'app-chat-history',
    standalone: true,
    imports: [CommonModule, ButtonModule, ListboxModule],
    template: `
        <div class="chat-history-container h-full flex flex-col p-3 border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
            <p-button 
                label="New Chat" 
                icon="pi pi-plus" 
                styleClass="w-full mb-3" 
                (onClick)="onNewChat.emit()">
            </p-button>

            <div class="flex-1 overflow-y-auto">
                <div 
                    *ngFor="let thread of threads" 
                    (click)="onSelectThread.emit(thread.thread_id)"
                    [ngClass]="{'bg-primary-100 dark:bg-primary-900/30 border-primary-500': activeThreadId === thread.thread_id}"
                    class="p-3 mb-2 cursor-pointer rounded-lg border border-transparent hover:border-surface-300 dark:hover:border-surface-600 transition-all flex justify-between items-center group">
                    
                    <div class="flex flex-col overflow-hidden">
                        <span class="text-sm font-medium truncate">{{ thread.thread_id | slice:0:8 }}...</span>
                        <span class="text-xs text-surface-500">{{ thread.last_activity | date:'short' }}</span>
                    </div>

                    <p-button 
                        icon="pi pi-trash" 
                        [rounded]="true" 
                        [text]="true" 
                        severity="danger" 
                        size="small"
                        styleClass="opacity-0 group-hover:opacity-100 transition-opacity"
                        (onClick)="$event.stopPropagation(); onDeleteThread.emit(thread.thread_id)">
                    </p-button>
                </div>
                
                <div *ngIf="threads.length === 0" class="text-center text-surface-500 mt-4">
                    No recent chats
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            height: 100%;
        }
    `]
})
export class ChatHistoryComponent {
    @Input() threads: ThreadSummary[] = [];
    @Input() activeThreadId: string | null = null;
    @Output() onSelectThread = new EventEmitter<string>();
    @Output() onDeleteThread = new EventEmitter<string>();
    @Output() onNewChat = new EventEmitter<void>();
}
