import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormComponent, SettingsComponent } from './settings.component';
import { Observable, of } from 'rxjs';
import { ChartSettings } from '../data/interfaces/chart.interface';
import { SettingsStore } from '../data/store/chart.store';

function fakeAsyncResponse<T>(data: T[]): Observable<T[]> {
  return of(data);
}

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsStore: SettingsStore;
  let mockData: ChartSettings[];
  let fakeGetUpdated: jasmine.Spy;
  let fakeGetStore: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    settingsStore = TestBed.inject(SettingsStore);
    fakeGetUpdated = spyOn(settingsStore, 'getUpdated').and.returnValue(2);
    mockData = [
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
    fakeGetStore = spyOn(settingsStore, 'getAllStoreData');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get settings on initialization', () => {
    // TODO: sometimes can catch error "Expected false to be true."
    fakeGetStore
      .and.returnValue(fakeAsyncResponse(mockData));
    component.getSettings();
    expect(component.settings.length).toBe(2);
    expect(component.settings[0].id).toBe(1);
  });

  it('should check to redraw', () => {
    spyOn(component, 'getSettings').and.callFake(()=>(true));
    component.checkToRedraw().subscribe(res => {
      expect(res).toBeTrue();
    });
  });
});
