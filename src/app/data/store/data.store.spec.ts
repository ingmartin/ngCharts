import { ChartData } from './../interfaces/data.interface';
import { TestBed } from '@angular/core/testing';
import { DataStore } from './data.store';

describe('DataStore', () => {
  let service: DataStore;
  let mockData: ChartData[];
  let falseData: any[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DataStore],
    });

    service = TestBed.inject(DataStore);

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
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  it('data is transformed by beforeUpload', () => {
    const result = service.beforeUpload(mockData);
    expect(result[0].all).toBe('all');
    expect(typeof result[0].birthdate).toBe(typeof new Date());
  });
});
