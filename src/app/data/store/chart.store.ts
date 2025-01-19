import { ChartSettings } from '../interfaces/chart.interface';
import { createStore, withProps } from '@ngneat/elf';
import { setEntities, withEntities, deleteEntities, selectAllEntities, upsertEntities } from '@ngneat/elf-entities';

let updated: number = 0;

export const settingsStore = createStore(
  { name: 'settings' },
  withEntities<ChartSettings>(),
  withProps<{ updated: number }>({ updated: updated })
);

export function updateSettingsStore(data: ChartSettings[]): boolean {
  updated += 1;
  settingsStore.update(setEntities(data));
  settingsStore.update((state) => ({
    ...state,
    updated: updated,
  }));
  return true;
}

export function deleteSettingItem(id: number): boolean {
  settingsStore.update(deleteEntities(id));
  updated += 1;
  settingsStore.update((state) => ({
    ...state,
    updated: updated,
  }));
  return true;
}

export function upsertSettingItem(id: number, data: ChartSettings): boolean {
  data.id = id === 0 ? (getMaxId() + 1) : id;
  settingsStore.update(
    upsertEntities({ ...data })
  )
  return true;
}

function getMaxId(): number {
  let max: number = 0;
  settingsStore.subscribe((state) => {
    settingsStore
      .pipe<ChartSettings[] | []>(selectAllEntities())
      .subscribe((val) => {
        if (val.length > 0) {
          val.filter((v,i,a) => {if (v.id > max) { max = v.id }});
        }
      });
  });
  return max;
}
