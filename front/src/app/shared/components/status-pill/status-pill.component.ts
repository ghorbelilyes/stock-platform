import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-status-pill',
    standalone: true,
    imports: [CommonModule],
    template: `
        <span [class]="getStatusClass()" class="px-3 py-1 rounded-full text-sm font-medium">
            {{ getLabel() }}
        </span>
    `
})
export class StatusPillComponent {
    @Input() status!: 'ok' | 'low' | 'out' | 'overstock' | 'high' | 'medium' | 'low-priority' | 'rejected';
    @Input() label?: string;

    getLabel(): string {
        if (this.label) return this.label;
        return this.status.charAt(0).toUpperCase() + this.status.slice(1).replace('-', ' ');
    }

    getStatusClass(): string {
        const classes: Record<string, string> = {
            'ok': 'bg-green-100 text-green-800',
            'low': 'bg-yellow-100 text-yellow-800',
            'out': 'bg-red-100 text-red-800',
            'rejected': 'bg-red-100 text-red-800',
            'overstock': 'bg-blue-100 text-blue-800',
            'high': 'bg-red-100 text-red-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low-priority': 'bg-gray-100 text-gray-800'
        };
        return classes[this.status] || 'bg-gray-100 text-gray-800';
    }
}
