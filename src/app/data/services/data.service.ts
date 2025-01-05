import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ChartData } from '../interfaces/data.interface';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  http : HttpClient = inject(HttpClient);
  apiUrl : string = 'http://localhost:8080/';

  constructor() { }

  getChartData(uri: string) {
    return this.http.get<ChartData[]>(`${this.apiUrl}${uri}`)
  }
}
