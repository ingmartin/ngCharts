import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { DataService } from './data/services/data.service';
import { DataStore } from './data/store/data.store';
import { SettingsStore } from './data/store/chart.store';
import { defaultChartSettings } from './data/interfaces/chart.interface';
import { Dialog, DIALOG_DATA, DialogModule, } from '@angular/cdk/dialog';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    DialogModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Charts';
  private breakpointObserver = inject(BreakpointObserver);
  dataService = inject(DataService);
  dataStore = inject(DataStore);
  settingsStore = inject(SettingsStore);
  activeLink: any = '';
  responseError: string = '';
  dialog = inject(Dialog);

  constructor() {
    this.settingsStore.updateStore(defaultChartSettings);
    this.dataService.getChartData()
    .subscribe({
      next: ((val) => this.dataStore.updateStore(val)),
      error: ((err) => this.openErrorDialog(err))
    });
  }

  openErrorDialog(err: Error): void {
    this.dialog.open(ErrorComponent, {
      data: {
        h1: 'Connection Error',
        text: 'Please check your connection to the server and try again.<br>' +
              'The following text contains the error message:',
        message: err.message,
      },
    });
    this.responseError = err.message
  }

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );
}

@Component({
  selector: 'app-settings-form',
  imports: [],
  templateUrl: './error/error.component.html',
  styleUrl: './error/error.component.css',
})
export class ErrorComponent {
  data = inject(DIALOG_DATA);
}