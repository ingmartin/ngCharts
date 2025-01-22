import { TestBed } from '@angular/core/testing';

import { DataService } from './data.service';
import { HttpClient, HttpErrorResponse, provideHttpClient, } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController, } from '@angular/common/http/testing';
import { ChartData } from '../interfaces/data.interface';

describe('DataService', () => {
  let service: DataService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('can test for network error', (done) => {
    const mockError = new ProgressEvent('error');
    service.getChartData().subscribe({
      next: () => fail('should have failed with the network error'),
      error: (error: HttpErrorResponse) => {
        expect(error.error).toBe(mockError);
        done();
      },
    });
    const req = httpTestingController.expectOne(service.apiUrl);
    req.error(mockError);
  });

  it('should get data', () => {
    const mockData: ChartData[] = [
      {
        id: 0,
        all: '',
        name: 'Maximilian',
        birthdate: new Date(),
        blood_group: 'A',
        sex: 'M',
        job: 'Engineer',
        company: 'Apple',
      },
      {
        id: 1,
        all: '',
        name: 'Katrina',
        birthdate: new Date(),
        blood_group: 'B-',
        sex: 'F',
        job: 'Teacher',
        company: 'University',
      },
    ];

    service.getChartData().subscribe((data: ChartData[]) => {
      expect(data).toEqual(mockData);
    });

    const mockReq = httpTestingController.expectOne(service.apiUrl);

    expect(mockReq.cancelled).toBeFalsy();
    expect(mockReq.request.responseType).toEqual('json');
    mockReq.flush(mockData);

    httpTestingController.verify();
  });
});
