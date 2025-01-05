import { ChartSettings } from '../interfaces/chart.interface';
import { createStore, withProps } from '@ngneat/elf';
import { setEntities, withEntities } from '@ngneat/elf-entities';


let updated: number = 0;

export const settingsStore = createStore(
    { name: 'data' },
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
    return  true
}
