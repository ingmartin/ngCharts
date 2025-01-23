import { TestBed } from '@angular/core/testing';
import { abStore, abInterface } from './abstract.store';
import { Observable, of } from 'rxjs';

class TestStore extends abStore<abInterface> {
  beforeUpload(data: abInterface[]): abInterface[] {
    return data;
  }
}

function fakeAsyncResponse<T>(data: T[]): Observable<T[]> {
  return of(data);
}

describe('abStore', () => {
  let service: TestStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestStore],
    });

    service = TestBed.inject(TestStore);
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  it('should have a default store name', () => {
    expect(service.store.name).toBe('store');
  });

  it('should update store and increment updated count', () => {
    const data: abInterface[] = [{ id: 1 }];
    const result = service.updateStore(data);
    expect(result).toBeTrue();
    expect(service.getUpdated()).toBe(1);
  });

  it('should delete an item and increment updated count', () => {
    const data: abInterface[] = [{ id: 1 }];
    service.updateStore(data);
    const result = service.deleteItem(1);
    expect(result).toBeTrue();
    expect(service.getUpdated()).toBe(2);
  });

  it('should upsert an item and increment updated count', () => {
    const data: abInterface = { id: 1 };
    const result = service.upsertItem(1, data);
    expect(result).toBeTrue();
    expect(service.getUpdated()).toBe(1);
  });

  it('should get all store data', (done) => {
    const data: abInterface[] = [{ id: 1 }];
    service.updateStore(data);
    service.getAllStoreData().subscribe((storeData) => {
      expect(storeData.length).toBe(1);
      expect(storeData[0].id).toBe(1);
      done();
    });
  });

  it('should get max id', () => {
    const data: abInterface[] = [{ id: 1 }, { id: 2 }];
    spyOn(service, 'getAllStoreData').and.returnValue(fakeAsyncResponse(data));
    const maxId = service.getMaxId();
    expect(maxId).toBe(2);
  });

  it('should select many by predicate', (done) => {
    const data: abInterface[] = [{ id: 1 }, { id: 2 }];
    service.updateStore(data);
    service.selectManyByPredicate((entity: abInterface) => entity.id > 1).subscribe((result) => {
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
      done();
    });
  });
});
