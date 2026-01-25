import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">{{ label }}</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ value }}</div>
                </div>
                <div class="flex items-center justify-center rounded-border" [ngClass]="iconBgClass" [style]="iconStyle">
                    <i [class]="icon" [ngClass]="iconColorClass"></i>
                </div>
            </div>
        </div>
    `
})
export class KpiCardComponent {
    @Input() label!: string;
    @Input() value!: string | number;
    @Input() icon!: string;
    @Input() iconColor: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan' = 'blue';
    
    get iconBgClass(): string {
        const classes: Record<string, string> = {
            'blue': 'bg-blue-100 dark:bg-blue-400/10',
            'green': 'bg-green-100 dark:bg-green-400/10',
            'orange': 'bg-orange-100 dark:bg-orange-400/10',
            'red': 'bg-red-100 dark:bg-red-400/10',
            'purple': 'bg-purple-100 dark:bg-purple-400/10',
            'cyan': 'bg-cyan-100 dark:bg-cyan-400/10'
        };
        return classes[this.iconColor] || classes['blue'];
    }
    
    get iconColorClass(): string {
        const classes: Record<string, string> = {
            'blue': 'text-blue-500',
            'green': 'text-green-500',
            'orange': 'text-orange-500',
            'red': 'text-red-500',
            'purple': 'text-purple-500',
            'cyan': 'text-cyan-500'
        };
        return classes[this.iconColor] || classes['blue'];
    }
    
    get iconStyle(): string {
        return 'width: 2.5rem; height: 2.5rem';
    }
}
