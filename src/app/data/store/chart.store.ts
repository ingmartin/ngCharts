import { ChartSettings } from '../interfaces/chart.interface';
import { Injectable } from '@angular/core';
import { abStore } from "./abstract.store";

@Injectable({ providedIn: 'root' })
export class SettingsStore extends abStore<ChartSettings>{
  constructor() {
    super('settingsStore');
  }

  override beforeUpload(data: ChartSettings[]): ChartSettings[] {
    return data
  }
}