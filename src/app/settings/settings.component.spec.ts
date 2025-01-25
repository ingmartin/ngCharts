import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormComponent, SettingsComponent, ConfirmComponent } from './settings.component';
import { Observable, of } from 'rxjs';
import { ChartSettings } from '../data/interfaces/chart.interface';
import { SettingsStore } from '../data/store/chart.store';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
    fakeGetStore = spyOn(settingsStore, 'getAllStoreData')
      .and.callFake((): Observable<ChartSettings[]> => of(mockData));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get settings on initialization', () => {
    component.getSettings();
    expect(component.settings.length).toBe(2);
    expect(component.settings[0].id).toBe(1);
  });
});


describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  let settingsStore: SettingsStore;
  let dialog: jasmine.SpyObj<Dialog>;
  let dialogRef: DialogRef<FormComponent>;
  let item: ChartSettings ={
    id: 1,
    title: 'Default Chart',
    subtitle: 'Default Chart',
    type: 'spline',
    wide: true,
    axes: ['birthdate', 'blood_group',],
    countby: 'decades',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: DIALOG_DATA, useValue: item },
        { provide: DialogRef, useValue: {} },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    settingsStore = TestBed.inject(SettingsStore);
    dialog = TestBed.inject(Dialog) as jasmine.SpyObj<Dialog>;
    dialog.open = jasmine.createSpy();
    dialogRef = TestBed.inject(DialogRef);
    dialogRef.close = jasmine.createSpy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return number of axis', () => {
    component.setAxesLength('pie');
    expect(component.minAxesNumber).toBe(1);
    component.setAxesLength('line');
    expect(component.minAxesNumber).toBe(2);
  });

  it('should create axes array for pie chart', () => {
    component.setAxesLength('pie');
    const result = component.makeAxesArray();
    expect(result.length).toBe(1)
  });

  it('should create axes array for area chart', () => {
    component.setAxesLength('area');
    const result = component.makeAxesArray();
    expect(result.length).toBe(2);
  });

  it('should increase axes array for area chart', () => {
    component.data.axes = ['birthday'];
    component.setAxesLength('area');
    const result = component.makeAxesArray();
    expect(result.length).toBe(2);
  });

  it('should reduce axes array for pie chart', () => {
    component.data.axes = ['birthday', 'blood_group'];
    component.setAxesLength('pie');
    const result = component.makeAxesArray();
    expect(result.length).toBe(1);
  });

  it('should get true if value exists in array but not on current index', ()=>{
    component.selects = ['birthday', 'blood_group'];
    expect(component.checkDisabled(0, 'blood_group')).toBe(true);
    expect(component.checkDisabled(0, 'birthdate')).toBe(false);
  });

  it('should close current dialog and open new if try to remove item', ()=>{
    component.form.value.remove = true;
    component.onSubmit()
    expect(dialogRef.close).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
  });
});

describe('ConfirmComponent', () => {
  let component: ConfirmComponent;
  let fixture: ComponentFixture<ConfirmComponent>;
  let settingsStore: SettingsStore;
  let dialogRef: DialogRef<ConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: DIALOG_DATA, useValue: {} },
        { provide: DialogRef, useValue: {} },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    settingsStore = TestBed.inject(SettingsStore);
    dialogRef = TestBed.inject(DialogRef);
    dialogRef.close = jasmine.createSpy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog after successful delete item', ()=>{
    spyOn(settingsStore, 'deleteItem').and.returnValue(true);
    component.onAgree();
    expect(dialogRef.close).toHaveBeenCalled();
  })
});