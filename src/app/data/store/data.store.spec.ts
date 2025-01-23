import { ChartData } from './../interfaces/data.interface';
import { TestBed } from '@angular/core/testing';
import { DataStore } from './data.store';
import { of, Observable } from 'rxjs';

export function fakeAsyncResponse(data: ChartData[]):Observable<ChartData[]> {
  return of(data);
}


describe('DataStore', () => {
  let service: DataStore;
  let mockData: ChartData[]

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [ DataStore ],
    });

    service = TestBed.inject(DataStore);
    mockData = [
      {
        id: 2,
        all: '',
        name: 'Maximilian',
        birthdate: new Date(),
        blood_group: 'A',
        sex: 'M',
        job: 'Engineer',
        company: 'Apple',
      },
    ];
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  it('data is transformed by beforeUpload', ()=>{
    const result = service.beforeUpload(mockData);
    expect(result[0].all).toEqual('all');
    expect(typeof result[0].birthdate).toBe(typeof new Date());
  })

  it('get max id', () => {
    spyOn(service, "getAllStoreData").and.returnValue(fakeAsyncResponse(mockData))
    const maxId = service.getMaxId();
    expect(maxId).toEqual(2);
  })
});
