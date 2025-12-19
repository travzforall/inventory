import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BaserowResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BaserowFilter {
  field: string;
  type:
    | 'equal'
    | 'not_equal'
    | 'contains'
    | 'contains_not'
    | 'higher_than'
    | 'lower_than'
    | 'empty'
    | 'not_empty';
  value: string | number | boolean;
}

export interface BaserowQueryOptions {
  page?: number;
  size?: number;
  orderBy?: string;
  filters?: BaserowFilter[];
  search?: string;
  include?: string[];
  exclude?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class BaserowService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.baserow.apiUrl;
  private readonly token = environment.baserow.token;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Token ${this.token}`,
      'Content-Type': 'application/json',
    });
  }

  private buildParams(options?: BaserowQueryOptions): HttpParams {
    let params = new HttpParams();

    // Always use user field names for readable responses
    params = params.set('user_field_names', 'true');

    if (options?.page) {
      params = params.set('page', options.page.toString());
    }
    if (options?.size) {
      params = params.set('size', options.size.toString());
    } else {
      params = params.set('size', '100'); // Default size
    }
    if (options?.orderBy) {
      params = params.set('order_by', options.orderBy);
    }
    if (options?.search) {
      params = params.set('search', options.search);
    }
    if (options?.include?.length) {
      params = params.set('include', options.include.join(','));
    }
    if (options?.exclude?.length) {
      params = params.set('exclude', options.exclude.join(','));
    }
    if (options?.filters?.length) {
      options.filters.forEach((filter) => {
        params = params.set(`filter__field_${filter.field}__${filter.type}`, String(filter.value));
      });
    }

    return params;
  }

  // Generic CRUD operations for any table
  getAll<T>(tableId: number, options?: BaserowQueryOptions): Observable<BaserowResponse<T>> {
    const url = `${this.apiUrl}/database/rows/table/${tableId}/`;
    return this.http.get<BaserowResponse<T>>(url, {
      headers: this.getHeaders(),
      params: this.buildParams(options),
    });
  }

  getById<T>(tableId: number, rowId: number): Observable<T> {
    const url = `${this.apiUrl}/database/rows/table/${tableId}/${rowId}/`;
    const params = new HttpParams().set('user_field_names', 'true');
    return this.http.get<T>(url, {
      headers: this.getHeaders(),
      params,
    });
  }

  create<T>(tableId: number, data: Partial<T>): Observable<T> {
    const url = `${this.apiUrl}/database/rows/table/${tableId}/?user_field_names=true`;
    return this.http.post<T>(url, data, {
      headers: this.getHeaders(),
    });
  }

  update<T>(tableId: number, rowId: number, data: Partial<T>): Observable<T> {
    const url = `${this.apiUrl}/database/rows/table/${tableId}/${rowId}/?user_field_names=true`;
    return this.http.patch<T>(url, data, {
      headers: this.getHeaders(),
    });
  }

  delete(tableId: number, rowId: number): Observable<void> {
    const url = `${this.apiUrl}/database/rows/table/${tableId}/${rowId}/`;
    return this.http.delete<void>(url, {
      headers: this.getHeaders(),
    });
  }

  // Search across a table
  search<T>(tableId: number, query: string, options?: BaserowQueryOptions): Observable<T[]> {
    return this.getAll<T>(tableId, { ...options, search: query }).pipe(map((res) => res.results));
  }

  // Get single row by field value
  getByField<T>(
    tableId: number,
    fieldName: string,
    value: string | number
  ): Observable<T | undefined> {
    return this.getAll<T>(tableId, {
      filters: [{ field: fieldName, type: 'equal', value }],
      size: 1,
    }).pipe(map((res) => res.results[0]));
  }
}
