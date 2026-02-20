import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/inventory.models';

export interface CategorySettings {
    id?: number;
    // category_id is needed if not using object
    category?: any;
    minQty?: number;
    maxQty?: number;
    minConfidence?: number;
    autoApprove?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/settings';

    getAllSettings(): Observable<ApiResponse<{ [key: string]: string }>> {
        return this.http.get<ApiResponse<{ [key: string]: string }>>(this.apiUrl);
    }

    updateSettings(settings: { [key: string]: string }): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(this.apiUrl, settings);
    }

    getCategorySettings(): Observable<ApiResponse<CategorySettings[]>> {
        return this.http.get<ApiResponse<CategorySettings[]>>(`${this.apiUrl}/categories`);
    }

    updateCategorySettings(settings: CategorySettings): Observable<ApiResponse<CategorySettings>> {
        return this.http.post<ApiResponse<CategorySettings>>(`${this.apiUrl}/categories`, settings);
    }

    updateCategorySettingsBulk(settings: CategorySettings[]): Observable<ApiResponse<CategorySettings[]>> {
        return this.http.post<ApiResponse<CategorySettings[]>>(`${this.apiUrl}/categories/bulk`, settings);
    }
}
