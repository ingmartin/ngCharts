import { TestBed } from '@angular/core/testing';
import { SettingsStore } from './chart.store';
import { ChartSettings } from '../interfaces/chart.interface';

describe('SettingsStore', () => {
  let service: SettingsStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [ SettingsStore ],
    });

    service = TestBed.inject(SettingsStore);
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });
});
