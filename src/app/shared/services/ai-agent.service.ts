import { Injectable } from '@angular/core';
import { TransferSuggestion } from '../models/inventory.models';
import { TransferService } from './transfer.service';

// TODO: Replace with actual AI/LLM API integration
// MOCK DATA UNTIL BACKEND READY
@Injectable({
    providedIn: 'root'
})
export class AiAgentService {
    constructor(private transferService: TransferService) {}

    // TODO: Replace with actual AI API call
    chat(prompt: string): Promise<{
        summary: string;
        suggestions: TransferSuggestion[];
        actions: Array<{ label: string; action: string; data?: any }>;
    }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const suggestions = this.transferService.getSuggestions();
                const filtered = prompt.toLowerCase().includes('7 days') || prompt.toLowerCase().includes('week')
                    ? suggestions.slice(0, 5)
                    : suggestions.slice(0, 10);

                resolve({
                    summary: `Based on your inventory data, I've identified ${filtered.length} transfer opportunities. These suggestions are based on current stock levels, sales trends, and reorder points.`,
                    suggestions: filtered,
                    actions: [
                        { label: 'Approve All', action: 'approve_all', data: { suggestionIds: filtered.map(s => s.id) } },
                        { label: 'Create Transfers', action: 'create_transfers', data: { suggestions: filtered } }
                    ]
                });
            }, 1500);
        });
    }
}
