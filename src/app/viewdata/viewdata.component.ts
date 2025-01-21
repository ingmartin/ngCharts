import { ChartData, NamesTypeOfChart } from './../data/interfaces/data.interface';
import { AxesNames, ChartSettings, ColorPalette, ColorScheme, CountByType, DefaultCountBy } from './../data/interfaces/chart.interface';
import { dataStore } from './../data/store/data.store';
import { Component, inject, signal } from '@angular/core';
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
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
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
  defaultCountBy = DefaultCountBy;
  private countByFilter: string[] = ['days', 'months', 'years'];
  datepicker = false;

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

  getData(): void {
    if (dataLastUpdated < this.dataUpdated) {
      dataStore.pipe<ChartData[] | []>(selectAllEntities()).subscribe((val) => {
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
      });
      dataLastUpdated = this.dataUpdated;
    } else {
      this.setDates(begin_date, end_date);
      redraw.next(true);
    }
  }

  getSettings(): void {
    if (settingsLastUpdated < this.settingsUpdated) {
      settingsStore
        .pipe<ChartSettings[] | []>(selectAllEntities())
        .subscribe((val) => {
          settings = val;
        });
      settingsLastUpdated = this.settingsUpdated;
    }
    this.datepicker = Boolean(settings.length);
  }

  setDates(start_date: Date | null, finish_date: Date | null): void {
    this.min_date_signal.set(min_date);
    this.max_date_signal.set(max_date);
    this.start_date_signal.set(start_date);
    this.finish_date_signal.set(finish_date);
  }

  filterData(): void {
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

  setStartDate(event: MatDatepickerInputEvent<Date>): void {
    this.start_date_signal.set(event.value);
    begin_date = event.value;
    this.filterData();
  }

  setFinishDate(event: MatDatepickerInputEvent<Date>): void {
    this.finish_date_signal.set(event.value);
    end_date = event.value;
    this.filterData();
  }

  Capitalize(str: string): string {
    return str
      .replace('birthdate', 'birth_date')
      .replace('sex', 'gender')
      .split('_')
      .map((v) => v[0].toUpperCase() + v.substring(1))
      .join(' ');
  }

  setTiles(): void {
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

  setChartOptions(): void {
    let idx: number = 0;
    for (let tile of settings) {
      let axes: any = {};
      let series: any = [];
      let abscissaValues: any[] = [];
      let chartKey: NamesTypeOfChart = tile.axes.length === 1 ? tile.axes[0] : tile.axes[1];
      let seriesData: any[] = [];

      if (
        tile.axes.length === 1 ||
        (tile.axes.includes('birthdate') && tile.countby === 'for all time')
      ) {
        chartKey = tile.axes.length === 1 ? tile.axes[0] : tile.axes[1];
        abscissaValues = [...new Set(data.map((item) => item[chartKey]))];
        seriesData = abscissaValues.map((v) => {
          const Val = v;
          return {
            name: Val,
            y: data.filter((item) => item[chartKey] === Val).length,
          };
        });
        series.push({
          type: tile.type,
          name: this.Capitalize(chartKey),
          data: seriesData,
        });

        if (tile.axes.length > 1) {
          axes[AxesNames[0] + 'Axis'] = {
            title: { text: this.Capitalize(chartKey) },
            categories: abscissaValues,
          };
        }
      } else {
        let mapFunc: any = (v: Date) => true;
        let compareFunc: any = (v1: any, v2: any) => true;
        let pointFunc: any = (a:any, b:any)=>(a === b);
        let chartPoints: any;
        let comparedKey: NamesTypeOfChart = tile.axes[0];

        if (comparedKey !== 'birthdate') {
          abscissaValues = [...new Set(data.map((item) => item[comparedKey]))];
          compareFunc = (a:any, b:any)=>(a === b);
        } else {
          let countby: string = tile.countby ? tile.countby : this.defaultCountBy;
          [mapFunc, compareFunc] = this.getCountByFunctions(countby);
          abscissaValues = this.getCountByData(mapFunc, countby);
        }

        if (chartKey !== 'birthdate') {
          chartPoints = [...new Set(data.map((item) => item[chartKey]))];
        } else {
          let countby: string = tile.countby ? tile.countby : this.defaultCountBy;
          [mapFunc, pointFunc] = this.getCountByFunctions(countby);
          chartPoints = this.getCountByData(mapFunc, countby);
        }

        for (let point of chartPoints) {
          seriesData = abscissaValues.map((v) => {
            let Val = v;
            return data.filter(
              (item) => (
                compareFunc(item[comparedKey], Val) &&
                pointFunc(item[chartKey], point)
              )
            ).length;
          });
          series.push({
            type: tile.type,
            name: point,
            data: seriesData,
          });
        }

        axes[AxesNames[0] + 'Axis'] = {
          title: { text: this.Capitalize(comparedKey) },
          categories: abscissaValues,
        };
        axes[AxesNames[1] + 'Axis'] = {
          title: { text: 'Values' },
        };
      }

      if (tile.colors && tile.colors !== 'default') {
        ColorPalette.map((v: ColorScheme)=>{if (v.title === tile.colors) axes['colors'] = v.colors});
      }

      let chartOptions: Highcharts.Options = {
        chart: { type: tile.type },
        title: { text: tile.title },
        subtitle: { text: tile.subtitle ? tile.subtitle : '' },
        accessibility: { enabled: false },
        ...axes,
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

  getCountByFunctions(countby: CountByType): object[] {
    let mapFunc: any = (v:any) => true;
    let parseFunc: any = (v:any)=>true;
    let compareFunc: any = (v:any)=>true;

    if (this.countByFilter.includes(countby)) {
      parseFunc = String
      if (countby === 'days') {
        mapFunc = (v: Date) => v.toISOString().split('T')[0];
      } else if (countby === 'months') {
        mapFunc = (v: Date) => (
          v.toISOString().split('T')[0]
          .split('-').slice(0, 2).join('-')
        );
      } else {
        mapFunc = (v: Date) => v.getFullYear();
        parseFunc = parseInt;
      }
      compareFunc = (v1: any, v2: any) => (mapFunc(v1) === parseFunc(v2));
    } else if (countby !== 'dynamic') {
      let diffYears: number =  countby === 'decades' ? 10 : 100;
      parseFunc = (v: number) => new Date(String(v))
      compareFunc = (v1: any, v2: any) => (
        v1 >= parseFunc(v2) && v1 < parseFunc(v2 + diffYears)
      );
    } else {} // TODO: dynamic

    return [mapFunc, compareFunc]
  }

  getCountByData(mapFunc: any, countby: CountByType): any[] {
    let axisValues: any[] = [];

    if (this.countByFilter.includes(countby)) {
      axisValues = [
        ...new Set(filteredDates.sort((a, b) => a.getTime() - b.getTime()).map(mapFunc)),
      ];
    } else if (countby !== 'dynamic') {
      let diffYears: number =  countby === 'decades' ? 10 : 100;
      let position: number = filteredDates.reduce(function (a, b) { return a < b ? a : b; }).getFullYear();
      let lastPosition: number = filteredDates.reduce(function (a, b) { return a > b ? a : b; }).getFullYear();
      position = Math.floor(position / diffYears) * diffYears;
      lastPosition = Math.ceil(lastPosition / diffYears) * diffYears;
      for (position; position < lastPosition; position += diffYears){
        axisValues.push(position);
      }
    } else {} // TODO: dynamic

    return axisValues
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

  checker = this.checkToRedraw().subscribe((res) => {
    if (res === true && dates.length > 0) {
      this.setChartOptions();
    }
  });
}
