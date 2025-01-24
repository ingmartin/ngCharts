import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ViewDataComponent } from './viewdata.component';
import { SettingsStore } from '../data/store/chart.store';
import { ChartSettings } from '../data/interfaces/chart.interface';
import { DataStore } from '../data/store/data.store';
import { ChartData } from '../data/interfaces/data.interface';

describe('ViewDataComponent', () => {
  let component: ViewDataComponent;
  let fixture: ComponentFixture<ViewDataComponent>;
  let settingsStore: SettingsStore;
  let dataStore: DataStore;
  let mockData: ChartData[];
  let mockSettings: ChartSettings[];
  let fakeGetDataUpdated: jasmine.Spy;
  let fakeGetDataStore: jasmine.Spy;
  let fakeGetSettingsUpdated: jasmine.Spy;
  let fakeGetSettingsStore: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule]
    }).compileComponents();

    dataStore = TestBed.inject(DataStore);
    fakeGetDataUpdated = spyOn(dataStore, 'getUpdated').and.returnValue(3);
    mockData = [
      {
        id: 5,
        all: '',
        name: 'Maximilian',
        birthdate: new Date(),
        blood_group: 'A',
        sex: 'M',
        job: 'Engineer',
        company: 'Apple',
      },
      {
        id: 2,
        all: '',
        name: 'Katrina',
        birthdate: new Date(),
        blood_group: 'B-',
        sex: 'F',
        job: 'Teacher',
        company: 'University',
      },
    ];
    fakeGetDataStore = spyOn(dataStore, 'getAllStoreData');

    settingsStore = TestBed.inject(SettingsStore);
    fakeGetSettingsUpdated = spyOn(settingsStore, 'getUpdated').and.returnValue(2);
    mockSettings = [
      {
        id: 1,
        title: 'Default Chart',
        subtitle: 'Default Chart',
        type: 'spline',
        wide: true,
        axes: ['birthdate', 'blood_group',],
        countby: 'decades',
      },
      {
        id: 2,
        title: 'Gender Chart',
        subtitle: null,
        type: 'column',
        axes: ['birthdate', 'sex',],
        countby: 'decades',
      }
    ];
    fakeGetSettingsStore = spyOn(settingsStore, 'getAllStoreData');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
