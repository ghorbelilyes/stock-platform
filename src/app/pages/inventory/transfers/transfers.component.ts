import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TransferService } from '../../../shared/services/transfer.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';
import { TransferSuggestion, Transfer } from '../../../shared/models/inventory.models';

@Component({
    selector: 'app-transfers',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, DialogModule, StatusPillComponent],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-2">Transfer Suggestions</h1>
                            <p class="text-muted-color">AI-generated transfer recommendations to optimize inventory levels.</p>
                        </div>
                        <p-button label="New Transfer" icon="pi pi-plus" (onClick)="showTransferWizard = true"></p-button>
                    </div>

                    <p-table [value]="suggestions" [paginator]="true" [rows]="10" [loading]="loadingSuggestions">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>From</th>
                                <th>To</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Priority</th>
                                <th>Reason</th>
                                <th>Confidence</th>
                                <th>Action</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-suggestion>
                            <tr>
                                <td>{{ suggestion.fromStoreName }}</td>
                                <td>{{ suggestion.toStoreName }}</td>
                                <td>{{ suggestion.productName }}</td>
                                <td>{{ suggestion.quantity }}</td>
                                <td>
                                    <app-status-pill 
                                        [status]="suggestion.priority === 'high' ? 'high' : suggestion.priority === 'medium' ? 'medium' : 'low-priority'"
                                        [label]="suggestion.priority">
                                    </app-status-pill>
                                </td>
                                <td>{{ suggestion.reason }}</td>
                                <td>{{ suggestion.confidence }}%</td>
                                <td>
                                    <p-button 
                                        label="Transfer" 
                                        icon="pi pi-check" 
                                        size="small"
                                        (onClick)="approveTransfer(suggestion.id)">
                                    </p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="8" class="text-center py-8 text-muted-color">
                                    No transfer suggestions available. Upload data to generate AI-powered recommendations.
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Active Transfers</h2>
                    <p-table [value]="transfers" [paginator]="true" [rows]="10" [loading]="loadingTransfers">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>From Store</th>
                                <th>To Store</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Reason</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-transfer>
                            <tr>
                                <td>{{ transfer.id }}</td>
                                <td>{{ transfer.createdAt | date:'short' }}</td>
                                <td>{{ transfer.sourceStoreName || transfer.sourceStoreId }}</td>
                                <td>{{ transfer.destinationStoreName || transfer.destinationStoreId }}</td>
                                <td>{{ transfer.items[0]?.productName || transfer.items[0]?.sku || 'N/A' }}</td>
                                <td>{{ transfer.items[0]?.quantity || 0 }}</td>
                                <td>{{ transfer.notes || 'N/A' }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center py-8 text-muted-color">
                                    No transfers found. Create a transfer to get started.
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <p-dialog [(visible)]="showTransferWizard" [modal]="true" [style]="{width: '50vw'}" header="Transfer Wizard">
            <p>Transfer wizard implementation coming soon...</p>
        </p-dialog>
    `
})
export class TransfersComponent implements OnInit {
    private transferService = inject(TransferService);
    suggestions: TransferSuggestion[] = [];
    transfers: Transfer[] = [];
    showTransferWizard = false;
    loadingSuggestions = false;
    loadingTransfers = false;

    ngOnInit() {
        this.loadSuggestions();
        this.loadTransfers();
    }

    private loadSuggestions() {
        this.loadingSuggestions = true;
        this.suggestions = this.transferService.getSuggestions();
        this.loadingSuggestions = false;
    }

    private loadTransfers() {
        this.loadingTransfers = true;
        this.transferService.getTransfers().subscribe({
            next: (transfers) => {
                this.transfers = transfers;
                this.loadingTransfers = false;
            },
            error: (error) => {
                console.error('Error loading transfers:', error);
                this.loadingTransfers = false;
            }
        });
    }

    approveTransfer(suggestionId: string) {
        this.transferService.approveSuggestion(suggestionId, undefined).subscribe({
            next: (transfer) => {
                // Add to transfers list
                this.transfers = [transfer, ...this.transfers];
                // Remove approved suggestion
                this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
            },
            error: (error) => {
                console.error('Error approving transfer:', error);
            }
        });
    }

    getTransferStatusType(status: string): 'ok' | 'low' | 'out' | 'high' | 'medium' | 'low-priority' {
        if (status === 'approved' || status === 'received' || status === 'closed') return 'ok';
        if (status === 'picked' || status === 'in_transit') return 'medium';
        return 'low-priority';
    }
}
