import { selectAllEntities } from '@ngneat/elf-entities';
import { Component } from '@angular/core';
import { ChartSettings } from '../data/interfaces/chart.interface';
import { settingsStore } from '../data/store/chart.store';

let settings: ChartSettings[] = [],
    settingsLastUpdated: number = 0;

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  private settingsUpdated: number = 0;
  settings: ChartSettings[] = [];
  
  constructor() {
    settingsStore.subscribe((state) => {
      this.settingsUpdated = state.updated;
      this.getSettings();
      this.settings = settings;
    });
  }
  
  getSettings() {
    if (settingsLastUpdated < this.settingsUpdated) {
      settingsStore.pipe<ChartSettings[] | []>(selectAllEntities())
        .subscribe(val => {
          if (val.length > 0) {
            settings = val;
          }
        });
      settingsLastUpdated = this.settingsUpdated;
    }
  }
}
