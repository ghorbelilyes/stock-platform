import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/inventory.models';


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
}
