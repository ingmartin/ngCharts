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
      imports: [
        SettingsComponent,
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.dialog.open = jasmine.createSpy();

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

  it('should open form for creating new item', () => {
    const expectedData: object = {data: {
        h1: 'Add Chart',
        id: 0,
        title: '',
        subtitle: '',
        type: null,
        countby: null,
        colors: null,
        axes: ['', ''],
      }
    }
    component.openDialog();
    expect(component.dialog.open).toHaveBeenCalled();
    expect(component.dialog.open).toHaveBeenCalledWith(
      FormComponent,
      expectedData
    );
  });

  it('should open form for editing existed item', () => {
    const item: ChartSettings = mockData[0]
    const expectedData: object = {data: {
        h1: 'Change Chart',
        ...item
      }
    }
    component.openDialog(item);
    expect(component.dialog.open).toHaveBeenCalled();
    expect(component.dialog.open).toHaveBeenCalledWith(
      FormComponent,
      expectedData
    );
  });
});


describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;
  let settingsStore: SettingsStore;
  let dialog: jasmine.SpyObj<Dialog>;
  let dialogRef: DialogRef<FormComponent>;
  let mockData: any[];

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

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockData = [
      { // valid
        title: 'Default Chart',
        subtitle: 'Default Chart',
        type: 'spline',
        axes: ['birthdate', 'blood_group',],
        countby: 'decades',
        wide: true,
        tall: null,
        remove: null,
        colors: null,
      },
      { // invalid
        id: 2,
        title: '',
        subtitle: null,
        type: 'column',
        axes: ['birthdate',],
        countby: 'dees',
      }
    ];

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
    const expectedData: object = {
      data: {
        h1: 'Remove Chart',
        id: 22,
        text: 'Are you going to remove the chart "null"?'
      }
    };
    component.form.value.remove = true;
    component.data.id = 22;
    component.onSubmit()
    expect(dialogRef.close).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(ConfirmComponent, expectedData)
  });

  it('should get true validation for form', ()=>{
    component.data.id = 1;
    component.form.patchValue(mockData[0])
    expect(component.form.valid).toBe(true);
  });

  it('should not get true because data is invalid', ()=>{
    component.data.id = 1;
    component.form.patchValue(mockData[1])
    expect(component.form.valid).not.toBe(true);
  });

  it('should send data for upsert and close current dialog', ()=>{
    spyOn(settingsStore, 'upsertItem').and.returnValue(true)
    component.data.id = 1;
    component.form.patchValue(mockData[0])
    component.onSubmit();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(settingsStore.upsertItem).toHaveBeenCalled();
  });

  it('should change array of selected items', ()=>{
    const expectedValue: string = 'job';
    component.selects = ['birthdate', 'blood_group'];
    expect(component.selects.length).toBe(2);
    component.onChange(expectedValue, 0);
    expect(component.selects.length).toBe(2);
    expect(component.selects[0]).toBe(expectedValue);
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