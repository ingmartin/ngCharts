import { ChartSettings } from './../data/interfaces/chart.interface';
import { dataStore } from './../data/store/data.store';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ChartData } from '../data/interfaces/data.interface';
import { selectAllEntities, selectManyByPredicate } from '@ngneat/elf-entities';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import {MatDatepickerInputEvent, MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import { settingsStore } from '../data/store/chart.store';

let dataLastUpdated: number = 0,
    data: ChartData[] = [],
    settings: ChartSettings[] = [],
    settingsLastUpdated: number = 0,
    dates: Date[] = [],
    min_date: Date | null = null,
    max_date: Date | null = null,
    begin_date: Date | null = null,
    end_date: Date | null = null;

interface ChartTile {
  Highcharts: typeof Highcharts,
  options: Highcharts.Options,
  cols: number,
  rows: number
}

@Component({
  selector: 'app-viewdata',
  templateUrl: './viewdata.component.html',
  styleUrl: './viewdata.component.css',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    AsyncPipe,
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    HighchartsChartModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDataComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private dataUpdated: number = 0;
  private settingsUpdated: number = 0;
  start_date_signal = signal<Date | null>(null);
  finish_date_signal = signal<Date | null>(null);
  min_date_signal = signal<Date | null>(null);
  max_date_signal = signal<Date | null>(null);
  tileBoardMobile: ChartTile[] = [];
  tileBoardDesktop: ChartTile[] = [];

  constructor() {
    dataStore.subscribe((state) => {
      this.dataUpdated = state.updated;
      this.getData();
    });

    settingsStore.subscribe((state) => {
      this.settingsUpdated = state.updated;
      this.getSettings();
    });

    this.setTiles();
  }

  getData() {
    if (dataLastUpdated < this.dataUpdated) {
      dataStore.pipe<ChartData[] | []>(selectAllEntities())
        .subscribe(val => {
          if (val.length > 0) {
            data = val;
            dates = [...new Set(data.map(item => item.birthdate))];
            min_date = dates.reduce(function (a, b) { return a < b ? a : b; });
            max_date = dates.reduce(function (a, b) { return a > b ? a : b; });
            this.setDates(min_date, max_date)
            begin_date = min_date;
            end_date = max_date;
          }
        });
      dataLastUpdated = this.dataUpdated;
    } else {
      this.setDates(begin_date, end_date)
    }
  }

  getSettings() {
    if (settingsLastUpdated < this.settingsUpdated) {
      settingsStore.pipe<ChartSettings[] | []>(selectAllEntities())
        .subscribe(val => {
          if (val.length > 0) {
            settings = val;
          }
        });
      settingsLastUpdated = this.settingsUpdated;
    }
  }

  setDates(start_date: Date | null, finish_date: Date | null) {
    this.min_date_signal.set(min_date)
    this.max_date_signal.set(max_date)
    this.start_date_signal.set(start_date)
    this.finish_date_signal.set(finish_date)
  }

  filterData() {
    let from = this.start_date_signal();
    let to = this.finish_date_signal();

    if (from != null && to != null) {
      dataStore.pipe<ChartData[] | []>(
        selectManyByPredicate((entity) => (
          entity.birthdate >= from
          && entity.birthdate <= to
        ))
      ).subscribe(val => {
        if (val.length > 0) {
          data = val;
        }
      });
    }
  }

  setStartDate(event: MatDatepickerInputEvent<Date>) {
    this.start_date_signal.set(event.value);
    begin_date = event.value;
    this.filterData();
  }

  setFinishDate(event: MatDatepickerInputEvent<Date>) {
    this.finish_date_signal.set(event.value);
    end_date = event.value;
    this.filterData();
  }

  setTiles() {
    this.tileBoardMobile = [];
    this.tileBoardDesktop = [];
    for (let tile of settings) {
      let chartOptions: Highcharts.Options = {
        chart: {
          type: tile.type
        },
        title: {
          text: tile.title
        },
        subtitle: {
          text: (tile.subtitle)? tile.subtitle : '',
        },
        xAxis: {
          title: {
            text: 'axis X'
          },
          categories: ["Mar", "Apr", "May"],
        },
        yAxis: {
          title: {
            text: 'axis Y'
          },
        },
        series: [
          {
            type: "area",
            name: "Col1",
            data: [1.2, 2.3, 2.5]
          },
          {
            type: "area",
            name: "Col2",
            data: [2.2, 1.3, 4.5]
          }
        ]
      }
      let tileMobile: ChartTile = {
        Highcharts: Highcharts,
        options: chartOptions,
        cols: 2,
        rows: (tile.tall)? 2 : 1,
      };
      this.tileBoardMobile.push(tileMobile)
      let tileDesktop: ChartTile = {
        Highcharts: Highcharts,
        options: chartOptions,
        cols: (tile.wide)? 2 : 1,
        rows: (tile.tall)? 2 : 1,
      };
      this.tileBoardDesktop.push(tileDesktop)
    }
  }

  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return this.tileBoardMobile;
      }
      return this.tileBoardDesktop;
    })
  );
}
