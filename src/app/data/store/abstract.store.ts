import { createStore, Store, withProps } from '@ngneat/elf';
import {
  setEntities,
  withEntities,
  deleteEntities,
  selectAllEntities,
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
    data = this.beforeUpload(data);
    this.store.update(setEntities(data));
    this.updated += 1;
    this.store.update((state) => ({
      ...state,
      updated: this.updated,
    }));
    return true;
  }

  abstract beforeUpload(data: T[]): T[];

  deleteItem(id: number): boolean {
    this.store.update(deleteEntities(id));
    this.updated += 1;
    this.store.update((state) => ({
      ...state,
      updated: this.updated,
    }));
    return true;
  }

  upsertItem(id: number, data: T): boolean {
    data['id'] = id === 0 ? this.getMaxId() + 1 : id;
    this.store.update(upsertEntities({ ...data }));
    this.updated += 1;
    this.store.update((state) => ({
      ...state,
      updated: this.updated,
    }));
    return true;
  }

  private getMaxId(): number {
    let max: number = 0;
    this.store.subscribe((state) => {
      this.store.pipe<T[] | []>(selectAllEntities()).subscribe((val) => {
        if (val.length > 0) {
          val.filter((v) => {
            if (v.id > max) {
              max = v.id;
            }
          });
        }
      });
    });
    return max;
  }
}
