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
import { map, tap, shareReplay, catchError } from 'rxjs/operators';

import { DataService } from './data/services/data.service';
import { updateDataStore } from './data/store/data.store';
import { updateSettingsStore } from './data/store/chart.store';
import { defaultChartSettings } from './data/interfaces/chart.interface';
import { Dialog, DIALOG_DATA, DialogModule, } from '@angular/cdk/dialog';
import { ChartData } from './data/interfaces/data.interface';

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
  activeLink: any = '';
  responseError: string = '';
  dialog = inject(Dialog);

  constructor() {
    updateSettingsStore(defaultChartSettings);
    this.dataService.getChartData()
    .subscribe({
      next: ((val) => updateDataStore(val)),
      error: ((err) => this.openDialog(err))
    });
  }

  openDialog(err: Error) {
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