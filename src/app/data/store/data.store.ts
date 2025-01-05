import { ChartData } from './../interfaces/data.interface';
import { createStore, withProps } from '@ngneat/elf';
import { setEntities, withEntities } from '@ngneat/elf-entities';


let updated: number = 0;

export const dataStore = createStore(
    { name: 'data' },
    withEntities<ChartData>(),
    withProps<{ updated: number }>({ updated: updated })
);

export function updateDataStore(data: ChartData[]): boolean {
    updated += 1;
    data = data.map((val) => {val.birthdate = new Date(val.birthdate); return val});
    dataStore.update(setEntities(data));
    dataStore.update((state) => ({
        ...state,
        updated: updated,
    }));
    return  true
}
