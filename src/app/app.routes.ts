import { Routes } from '@angular/router';
import { ViewDataComponent } from './viewdata/viewdata.component';
import { SettingsComponent } from './settings/settings.component';
import { NotfoundComponent } from './notfound/notfound.component';

export const routes: Routes = [
  { path: 'dashboard', component: ViewDataComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '404', component: NotfoundComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/404', pathMatch: 'full' },
];
