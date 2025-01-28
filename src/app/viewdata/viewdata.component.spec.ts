import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewDataComponent } from './viewdata.component';
import { SettingsStore } from '../data/store/chart.store';
import { ChartSettings } from '../data/interfaces/chart.interface';
import { DataStore } from '../data/store/data.store';
import { ChartData } from '../data/interfaces/data.interface';
import { Observable, of } from 'rxjs';

describe('ViewDataComponent', () => {
  let component: ViewDataComponent;
  let fixture: ComponentFixture<ViewDataComponent>;
  let settingsStore: SettingsStore;
  let dataStore: DataStore;
  let mockData: ChartData[];
  let mockSettings: ChartSettings[];
  let fakeGetDataStore: jasmine.Spy;
  let fakeGetSettingsStore: jasmine.Spy;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ViewDataComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    dataStore = TestBed.inject(DataStore);
    mockData = [
      {
        id: 5,
        all: '',
        name: 'Maximilian',
        birthdate: new Date('2022-12-31'),
        blood_group: 'A',
        sex: 'M',
        job: 'Engineer',
        company: 'Apple',
      },
      {
        id: 2,
        all: '',
        name: 'Katrina',
        birthdate: new Date('2023-05-10'),
        blood_group: 'B-',
        sex: 'F',
        job: 'Teacher',
        company: 'University',
      },
      {
        id: 3,
        all: '',
        name: 'Maria',
        birthdate: new Date('2021-02-28'),
        blood_group: 'AB+',
        sex: 'F',
        job: 'Nurse',
        company: 'Hospital',
      },
    ];
    fakeGetDataStore = spyOn(dataStore, 'getAllStoreData');
    fakeGetDataStore.and.callFake(
      (): Observable<ChartData[]>=>of(mockData)
    );

    settingsStore = TestBed.inject(SettingsStore);
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
    fakeGetSettingsStore.and.callFake(
      (): Observable<ChartSettings[]>=>of(mockSettings)
    );
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('get settings', () => {
    component.getSettings();
    expect(component.settings.length).toBe(2);
    expect(component.settings[0].id).toBe(1);
  });

  it('should get data if ', () => {
    component.filterData();
    expect(component.data.length).toBe(3);
    expect(component.data[0].id).toBe(5);
  });

  it('filter data', () => {
    spyOn(dataStore, 'selectManyByPredicate').and.callFake(
      (): Observable<ChartData[]>=>of(mockData.slice(1, 2)));

    component.filterData();
    component.dateSignalStart.set(new Date('2023-01-01'));
    component.dateSignalFinish.set(new Date('2023-12-31'));
    component.filterData();
    expect(component.data.length).toBe(1);
    expect(component.data[0].id).toBe(2);
  });

  it('set filtered dates', () => {
    const filteredDates: Date[] = component.setFilteredDates(mockData);
    expect(filteredDates.length).toBe(3);
    const expectedDate: Date = new Date('2021-02-28');
    expect(filteredDates[0]).toEqual(expectedDate);
  });

  it('capitalize', () => {
    expect(component.Capitalize('sex')).toBe('Gender');
    expect(component.Capitalize('birthdate')).toBe('Birth Date');
    expect(component.Capitalize('blood_group')).toBe('Blood Group');
    expect(component.Capitalize('job')).toBe('Job');
  });

  it('set tiles', () => {
    fakeGetSettingsStore.and.callFake(
      (): Observable<ChartSettings[]>=>of(mockSettings.slice(0,1)))
    component.getSettings();
    expect(component.settings.length).toBe(1);
    component.setTiles();
    expect(component.tileSetDesktop.length).toBe(1);
    expect(component.tileSetMobile.length).toBe(1);
  });

  it('should not set tiles if settings are empty', () => {
    component.setTiles();
    expect(component.tileSetDesktop.length).toBe(0);
    expect(component.tileSetMobile.length).toBe(0);
  })

  it('should return functions for countby === days', () => {
    const testDate = new Date('2022-06-12');
    const expectedStrDate = '2022-06-12';
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions('days');
    const parseFunc = String;
    const expectedMapFunc = (v: Date) => v.toISOString().split('T')[0];
    const expectedCompareFunc = (v1: any, v2: any) => (expectedMapFunc(v1) === parseFunc(v2));
    expect(typeof mapFunc).toBe(typeof expectedMapFunc);
    expect(mapFunc(testDate)).toBe(expectedStrDate);
    expect(mapFunc(testDate)).toBe(expectedMapFunc(testDate));
    expect(typeof compareFunc).toEqual(typeof expectedCompareFunc);
    expect(compareFunc(testDate, expectedStrDate)).toBe(true);
    expect(compareFunc(testDate, expectedStrDate)).toBe(expectedCompareFunc(testDate, expectedStrDate));
  });

  it('should return functions for countby === month', () => {
    const testDate = new Date('2022-06-12');
    const expectedStrDate = '2022-06';
    const parseFunc = String;
    const expectedMapFunc = (v: Date) => (
      v.toISOString().split('T')[0]
      .split('-').slice(0, 2).join('-')
    );
    const expectedCompareFunc = (v1: any, v2: any) => (expectedMapFunc(v1) === parseFunc(v2));
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions('months');
    expect(typeof mapFunc).toBe(typeof expectedMapFunc);
    expect(mapFunc(testDate)).toBe(expectedStrDate);
    expect(mapFunc(testDate)).toBe(expectedMapFunc(testDate));
    expect(typeof compareFunc).toEqual(typeof expectedCompareFunc);
    expect(compareFunc(testDate, expectedStrDate)).toBe(true);
    expect(compareFunc(testDate, expectedStrDate)).toBe(expectedCompareFunc(testDate, expectedStrDate));
  });

  it('should return functions for countby === years', () => {
    const testDate = new Date('2022-06-12');
    const expectedStrDate = 2022;
    const parseFunc = parseInt;
    const expectedMapFunc = (v: Date) => v.getFullYear();
    const expectedCompareFunc = (v1: any, v2: any) => (expectedMapFunc(v1) === parseFunc(v2));
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions('years');
    expect(typeof mapFunc).toBe(typeof expectedMapFunc);
    expect(mapFunc(testDate)).toBe(expectedStrDate);
    expect(mapFunc(testDate)).toBe(expectedMapFunc(testDate));
    expect(typeof compareFunc).toEqual(typeof expectedCompareFunc);
    expect(compareFunc(testDate, expectedStrDate)).toBe(true);
    expect(compareFunc(testDate, expectedStrDate)).toBe(expectedCompareFunc(testDate, expectedStrDate));
  });

  it('should return functions for countby === decades', () => {
    const testDate = new Date('2022-06-12');
    const expectedStrDate = 2020;
    const diffYears = 10;
    const parseFunc = (v: number) => new Date(String(v));
    const expectedCompareFunc = (v1: any, v2: any) => (
      v1 >= parseFunc(v2) && v1 < parseFunc(v2 + diffYears)
    );
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions('decades');
    expect(typeof compareFunc).toEqual(typeof expectedCompareFunc);
    expect(compareFunc(testDate, expectedStrDate)).toBe(true);
    expect(compareFunc(testDate, expectedStrDate)).toBe(expectedCompareFunc(testDate, expectedStrDate));
  });

  it('should return functions for countby === centuries', () => {
    const testDate = new Date('2022-06-12');
    const expectedStrDate = 2000;
    const diffYears = 100;
    const parseFunc = (v: number) => new Date(String(v));
    const expectedCompareFunc = (v1: any, v2: any) => (
      v1 >= parseFunc(v2) && v1 < parseFunc(v2 + diffYears)
    );
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions('centuries');
    expect(typeof compareFunc).toEqual(typeof expectedCompareFunc);
    expect(compareFunc(testDate, expectedStrDate)).toBe(true);
    expect(compareFunc(testDate, expectedStrDate)).toBe(expectedCompareFunc(testDate, expectedStrDate));
  });

  it('get axis array of dates for countby === days', () => {
    const filteredDates: Date[] = component.setFilteredDates(mockData);
    const countby = 'days';
    const expectedDates = ['2021-02-28', '2022-12-31', '2023-05-10']
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions(countby);
    const axisValues = component.getCountByDate(mapFunc, countby, filteredDates);
    expect(axisValues).toEqual(expectedDates);
  });

  it('get axis array of dates for countby === months', () => {
    const filteredDates: Date[] = component.setFilteredDates(mockData);
    const countby = 'months';
    const expectedDates = ['2021-02', '2022-12', '2023-05']
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions(countby);
    const axisValues = component.getCountByDate(mapFunc, countby, filteredDates);
    expect(axisValues).toEqual(expectedDates);
  });

  it('get axis array of dates for countby === years', () => {
    const filteredDates: Date[] = component.setFilteredDates(mockData);
    const countby = 'years';
    const expectedDates = [2021, 2022, 2023]
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions(countby);
    const axisValues = component.getCountByDate(mapFunc, countby, filteredDates);
    expect(axisValues).toEqual(expectedDates);
  });

  it('get axis array of dates for countby === decades', () => {
    const filteredDates: Date[] = component.setFilteredDates(mockData);
    const countby = 'decades';
    const expectedDates = [2020]
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions(countby);
    const axisValues = component.getCountByDate(mapFunc, countby, filteredDates);
    expect(axisValues).toEqual(expectedDates);
  });

  it('get axis array of dates for countby === caenturies', () => {
    const filteredDates: Date[] = component.setFilteredDates(mockData);
    const countby = 'centuries';
    const expectedDates = [2000]
    let mapFunc: any = ()=>{};
    let compareFunc: any = ()=>{};
    [mapFunc, compareFunc] = component.getCountByFunctions(countby);
    const axisValues = component.getCountByDate(mapFunc, countby, filteredDates);
    expect(axisValues).toEqual(expectedDates);
  });

  it ('should not set charts options if data array is empty', ()=>{
    fakeGetSettingsStore.and.callFake(
      (): Observable<ChartSettings[]>=>of(mockSettings.slice(0, 1)))
    component.getSettings();
    component.setTiles();
    expect(component.tileSetDesktop.length).toBe(1);
    expect(component.tileSetMobile.length).toBe(1);
    expect(component.tileSetDesktop[0].Highcharts).toBe(null);
    expect(component.tileSetMobile[0].Highcharts).toBe(null);
    component.setChartOptions();
    expect(component.tileSetDesktop[0].Highcharts).toBe(null);
    expect(component.tileSetMobile[0].Highcharts).toBe(null);
  });

  it ('set charts options', ()=>{
    jasmine.clock().install();
    fakeGetSettingsStore.and.callFake(
      (): Observable<ChartSettings[]>=>of(mockSettings.slice(0, 1)))
    fakeGetDataStore.and.callFake(
        (): Observable<ChartData[]>=>of(mockData))
    component.getSettings();
    component.setTiles();
    expect(component.tileSetDesktop.length).toBe(1);
    expect(component.tileSetMobile.length).toBe(1);
    expect(component.tileSetDesktop[0].Highcharts).toBe(null);
    expect(component.tileSetMobile[0].Highcharts).toBe(null);
    component.filterData();
    component.setChartOptions();
    jasmine.clock().tick(20);
    expect(component.tileSetDesktop[0].Highcharts).not.toBe(null);
    expect(component.tileSetMobile[0].Highcharts).not.toBe(null);
    expect(component.tileSetDesktop[0].options.colors).toBe(undefined);
    jasmine.clock().uninstall()
  });

  it ('should set color palette for charts options', ()=>{
    jasmine.clock().install();
    const testedSettings: ChartSettings = mockSettings[0];
    testedSettings.colors = 'darkgreen';
    const expectedColorScheme: string[] = ['#154033', '#333E0B', '#0B341F', '#253B1E', '#222F1E'];
    fakeGetSettingsStore.and.callFake(
      (): Observable<ChartSettings[]>=>of([testedSettings]))
    fakeGetDataStore.and.callFake(
        (): Observable<ChartData[]>=>of(mockData))
    component.getSettings();
    component.setTiles();
    component.filterData();
    component.setChartOptions();
    jasmine.clock().tick(20);
    expect(component.tileSetDesktop[0].Highcharts).not.toBe(null);
    expect(component.tileSetDesktop[0].options.colors).toEqual(expectedColorScheme);
    jasmine.clock().uninstall()
  });
});
