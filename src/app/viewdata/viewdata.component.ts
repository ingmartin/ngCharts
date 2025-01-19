import {
  ChartData,
  NamesOfFields,
  NamesOfType,
} from './../data/interfaces/data.interface';
import {
  AxisesNames,
  ChartSettings,
} from './../data/interfaces/chart.interface';
import { dataStore } from './../data/store/data.store';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { selectAllEntities, selectManyByPredicate } from '@ngneat/elf-entities';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import {
  MatDatepickerInputEvent,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { settingsStore } from '../data/store/chart.store';
import { BehaviorSubject, Observable } from 'rxjs';

let dataLastUpdated: number = 0,
  data: ChartData[] = [],
  settings: ChartSettings[] = [],
  settingsLastUpdated: number = 0,
  dates: Date[] = [],
  filteredDates: Date[] = [],
  min_date: Date | null = null,
  max_date: Date | null = null,
  begin_date: Date | null = null,
  end_date: Date | null = null,
  redraw = new BehaviorSubject<boolean>(false);

interface ChartTile {
  Highcharts: null | typeof Highcharts;
  options: Highcharts.Options;
  cols: number;
  rows: number;
  type: 'mob' | 'desk';
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
    MatDatepickerModule,
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
    settingsStore.subscribe((state) => {
      this.settingsUpdated = state.updated;
      this.getSettings();
      this.setTiles();
    });
    dataStore.subscribe((state) => {
      this.dataUpdated = state.updated;
      this.getData();
    });
  }

  checkToRedraw(): Observable<boolean> {
    return redraw.asObservable();
  }

  checker$ = this.checkToRedraw().subscribe((res) => {
    if (res === true && dates.length > 0) {
      this.setChartOptions();
    }
  });

  getData() {
    if (dataLastUpdated < this.dataUpdated) {
      dataStore.pipe<ChartData[] | []>(selectAllEntities()).subscribe((val) => {
        if (val.length > 0) {
          data = val;
          dates = [...new Set(data.map((item) => item.birthdate))];
          filteredDates = dates;
          min_date = dates.reduce(function (a, b) {
            return a < b ? a : b;
          });
          max_date = dates.reduce(function (a, b) {
            return a > b ? a : b;
          });
          this.setDates(min_date, max_date);
          begin_date = min_date;
          end_date = max_date;
          redraw.next(true);
        }
      });
      dataLastUpdated = this.dataUpdated;
    } else {
      this.setDates(begin_date, end_date);
      redraw.next(true);
    }
  }

  getSettings() {
    if (settingsLastUpdated < this.settingsUpdated) {
      settingsStore
        .pipe<ChartSettings[] | []>(selectAllEntities())
        .subscribe((val) => {
          if (val.length > 0) {
            settings = val;
          }
        });
      settingsLastUpdated = this.settingsUpdated;
    }
  }

  setDates(start_date: Date | null, finish_date: Date | null) {
    this.min_date_signal.set(min_date);
    this.max_date_signal.set(max_date);
    this.start_date_signal.set(start_date);
    this.finish_date_signal.set(finish_date);
  }

  filterData() {
    let from = this.start_date_signal();
    let to = this.finish_date_signal();
    if (from != null && to != null) {
      dataStore
        .pipe<ChartData[] | []>(
          selectManyByPredicate(
            (entity) => entity.birthdate >= from && entity.birthdate <= to
          )
        )
        .subscribe((val) => {
          if (val.length > 0) {
            data = val;
            filteredDates = [...new Set(data.map((item) => item.birthdate))];
            redraw.next(true);
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

  Capitalize(str: string): string {
    return str
      .split('_')
      .map((v) => v[0].toUpperCase() + v.substring(1))
      .join(' ');
  }

  setTiles() {
    this.tileBoardMobile = [];
    this.tileBoardDesktop = [];
    let idx: number = 0;
    if (this.tileBoardMobile.length === 0) {
      let series: Highcharts.SeriesOptionsType[] = [];
      for (let i = 0; i <= 20; ++i) {
        series.push({ type: 'line', name: '', data: [] });
      }
      for (let tile of settings) {
        let tileMobile: ChartTile = {
          Highcharts: null,
          options: {},
          cols: 2,
          rows: tile.tall ? 2 : 1,
          type: 'mob',
        };
        this.tileBoardMobile[idx] = tileMobile;
        let tileDesktop: ChartTile = {
          Highcharts: null,
          options: {},
          cols: tile.wide ? 2 : 1,
          rows: tile.tall ? 2 : 1,
          type: 'desk',
        };
        this.tileBoardDesktop[idx] = tileDesktop;
        ++idx;
      }
    }
  }

  setChartOptions() {
    let idx: number = 0;
    for (let tile of settings) {
      let axises: any = {};
      let series: any = [];
      let uniqueTarget: any[] = [];
      let keyTarget: NamesOfType = tile.axises.length === 1 ? tile.axises[0] : tile.axises[1];
      let seriesData: any[] = [];
      let countByFilter: string[] = ['days', 'months', 'years'];
      let targetPoints: any = [...new Set(data.map((item) => item[keyTarget]))];
      var mapFunction: any = (v: Date) => true;
      var compareFunction: any = (v1: any, v2: any) => true;

      if (tile.axises[0] === 'birthdate' && tile.countby !== 'for all time') {
        tile.countby = tile.countby ? tile.countby : 'days';
        keyTarget = tile.axises[1];
        if (tile.countby && countByFilter.includes(tile.countby)) {
          var parseFunc: any = (str: string) => str;
          if (tile.countby === 'days') {
            mapFunction = (v: Date) => v.toISOString().split('T')[0];
          } else if (tile.countby === 'months') {
            mapFunction = (v: Date) => (
              v.toISOString().split('T')[0]
              .split('-').slice(0, 2).join('-')
            );
          } else {
            mapFunction = (v: Date) => v.getFullYear();
            parseFunc = parseInt;
          }
          uniqueTarget = [
            ...new Set(filteredDates
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((v) => mapFunction(v))
            ),
          ];
          compareFunction = (v1: any, v2: any) => (mapFunction(v1) === parseFunc(v2));
        } else if (tile.countby !== 'dynamic') {
          var diffYears: number =  tile.countby === 'decades' ? 10 : 100;
          let uniqueYears: number[] = [
            ...new Set(
              filteredDates
                .sort((a, b) => a.getTime() - b.getTime())
                .map((v) => v.getFullYear())
            ),
          ];
          let position = Math.floor(uniqueYears[0] / diffYears) * diffYears;
          let lastPosition = Math.ceil(uniqueYears[uniqueYears.length - 1] / diffYears) * diffYears;
          for (position; position < lastPosition; position += diffYears){
            uniqueTarget.push(position);
          }
          parseFunc = (v: any) => new Date(String(v));
          compareFunction = (v1: any, v2: any) => (
            v1 >= parseFunc(v2) && v1 < parseFunc(v2 + diffYears)
          );
        } else {}
        axises[AxisesNames[0] + 'Axis'] = {
          title: { text: this.Capitalize(tile.axises[0]) + "'s" },
          categories: uniqueTarget,
        };
        axises[AxisesNames[1] + 'Axis'] = {
          title: { text: this.Capitalize(keyTarget) + "'s" },
        };
        for (let point of targetPoints) {
          seriesData = uniqueTarget.map((v) => {
            const Val = v;
            return data.filter(
              (item) => (
                compareFunction(item['birthdate'], Val) &&
                item[keyTarget] === point
              )
            ).length;
          });
          series.push({
            type: tile.type,
            name: point,
            data: seriesData,
          });
        }
      } else if (
        tile.axises.length === 1 ||
        (tile.axises[0] === 'birthdate' && tile.countby === 'for all time')
      ) {
        keyTarget = tile.axises.length === 1 ? tile.axises[0] : tile.axises[1];
        uniqueTarget = [...new Set(data.map((item) => item[keyTarget]))];
        seriesData = uniqueTarget.map((v) => {
          const Val = v;
          return {
            name: Val,
            y: data.filter((item) => item[keyTarget] === Val).length,
          };
        });
        if (tile.axises.length > 1) {
          axises[AxisesNames[0] + 'Axis'] = {
            title: { text: this.Capitalize(keyTarget) + "'s" },
            categories: uniqueTarget,
          };
        }
        series.push({
          type: tile.type,
          name: this.Capitalize(keyTarget) + "'s",
          data: seriesData,
        });
      }

      let chartOptions: Highcharts.Options = {
        chart: { type: tile.type },
        title: { text: tile.title },
        subtitle: { text: tile.subtitle ? tile.subtitle : '' },
        accessibility: { enabled: false },
        ...axises,
        series: series,
      };
      this.tileBoardDesktop[idx] = {
        ...this.tileBoardDesktop[idx],
        Highcharts: Highcharts,
        options: chartOptions,
      };
      this.tileBoardMobile[idx] = {
        ...this.tileBoardMobile[idx],
        Highcharts: Highcharts,
        options: chartOptions,
      };
      ++idx;
    }
    redraw.next(false);
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
