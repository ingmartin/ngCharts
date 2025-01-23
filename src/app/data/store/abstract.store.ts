import { createStore, Store, withProps } from '@ngneat/elf';
import {
  setEntities,
  withEntities,
  deleteEntities,
  selectAllEntities,
  selectManyByPredicate,
  upsertEntities,
} from '@ngneat/elf-entities';
import { Observable } from 'rxjs';

export interface abInterface {
  id: number;
}

export abstract class abStore<T extends abInterface> {
  private name: string = '';
  private updated: number = 0;
  store: Store;

  constructor(name: string = 'store') {
    this.name = name;
    this.store = createStore(
      { name: this.name },
      withEntities<T>(),
      withProps<{ updated: number }>({ updated: this.updated })
    );
  }

  getUpdated(): number {
    return this.updated;
  }

  getAllStoreData(): Observable<T[]> {
    return this.store.pipe<T[]>(selectAllEntities());
  }

  updateStore(data: T[]): boolean {
    let result = true;
    try {
      data = this.beforeUpload(data);
      this.store.update(setEntities(data));
      this.updated += 1;
      this.store.update((state) => ({
        ...state,
        updated: this.updated,
      }));
    } catch (error) {
      console.log(error);
      result = false;
    }
    return result;
  }

  abstract beforeUpload(data: T[]): T[];

  deleteItem(id: number): boolean {
    let result = true;
    try {
      this.store.update(deleteEntities(id));
      this.updated += 1;
      this.store.update((state) => ({
        ...state,
        updated: this.updated,
      }));
    } catch (error) {
      console.log(error);
      result = false;
    }
    return result;
  }

  upsertItem(id: number, data: T): boolean {
    let result = true;
    try {
      data['id'] = id === 0 ? this.getMaxId() + 1 : id;
      this.store.update(upsertEntities({ ...data }));
      this.updated += 1;
      this.store.update((state) => ({
        ...state,
        updated: this.updated,
      }));
    } catch (error) {
      console.log(error);
      result = false;
    }
    return result;
  }

  selectManyByPredicate(predicate: any) {
    return this.store
          .pipe<T[] | []>(selectManyByPredicate(predicate));
  }

  getMaxId(): number {
    let max: number = 0;
    this.store.subscribe((state) => {
      this.getAllStoreData().subscribe((val) => {
        val.filter((v) => {
          if (v.id > max) { max = v.id; }
        });
      });
    });
    return max;
  }
}
