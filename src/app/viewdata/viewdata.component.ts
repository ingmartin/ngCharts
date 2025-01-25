import { ChartData, NamesTypeOfChart } from './../data/interfaces/data.interface';
import { AxesNames, ChartSettings, ColorPalette, ColorScheme, CountByType, DefaultCountBy } from './../data/interfaces/chart.interface';
import { DataStore } from './../data/store/data.store';
import { Component, inject, signal } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SettingsStore } from '../data/store/chart.store';

let dataLastUpdated: number = 0;

let filteredDates: Date[] = [];
let minDateOfData: Date | null = null;
let maxDateOfData: Date | null = null;
let startDate: Date | null = null;
let finishDate: Date | null = null;

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
  private countByFilter: string[] = ['days', 'months', 'years'];
  private tileBoardMobile: ChartTile[] = [];
  private tileBoardDesktop: ChartTile[] = [];
  private dataStore = inject(DataStore);
  private settingsStore = inject(SettingsStore);
  private settings: ChartSettings[] = [];
  private data: ChartData[] = [];
  dateSignalStart = signal<Date | null>(null);
  dateSignalFinish = signal<Date | null>(null);
  dateSignalMin = signal<Date | null>(null);
  dateSignalMax = signal<Date | null>(null);
  defaultCountBy: CountByType = DefaultCountBy;
  settingsNotNull: boolean = false;
  redrawCharts: boolean = false;

  constructor() {
    this.settingsStore.store.subscribe(() => {
      this.getSettings();
      this.setTiles();
      this.dataStore.store.subscribe(() => {
        this.getData();
        this.setChartOptions();
      })
    });
  }

  getSettings(): void {
    this.settingsStore.getAllStoreData()
      .subscribe((val) => {
        this.settings = val;
      });
    this.settingsNotNull = Boolean(this.settings.length);
  }

  getData(): void {
    this.dataUpdated = this.dataStore.getUpdated();
    if (dataLastUpdated < this.dataUpdated) {
      this.dataStore.getAllStoreData().subscribe((val) => {
        this.data = val;
        filteredDates = this.setFilteredDates(this.data);
        minDateOfData = filteredDates[0];
        maxDateOfData = filteredDates[filteredDates.length - 1];
        startDate = minDateOfData;
        finishDate = maxDateOfData;
        this.setDatesSignals();
      });
      dataLastUpdated = this.dataUpdated;
    } else {
      this.setDatesSignals();
      this.filterData();
    }
  }

  filterData(): void {
    let from = this.dateSignalStart();
    let to = this.dateSignalFinish();
    if (from != null && to != null) {
      this.dataStore.selectManyByPredicate(
          (entity: any) => entity.birthdate >= from && entity.birthdate <= to
        )
        .subscribe((val) => {
          this.data = val;
          filteredDates = this.setFilteredDates(this.data);
          this.setChartOptions();
        });
    }
  }

  setDatesSignals(): void {
    this.dateSignalMin.set(minDateOfData);
    this.dateSignalMax.set(maxDateOfData);
    this.dateSignalStart.set(startDate);
    this.dateSignalFinish.set(finishDate);
  }

  setFilteredDates(data: ChartData[]): Date[] {
    let dates: Date[] = [];
    dates = [...new Set(data.map((item) => item.birthdate))];
    dates = dates.sort((a, b) => a.getTime() - b.getTime());
    return dates
  }

  setStartDate(event: MatDatepickerInputEvent<Date>): void {
    this.dateSignalStart.set(event.value);
    startDate = event.value;
    this.filterData();
  }

  setFinishDate(event: MatDatepickerInputEvent<Date>): void {
    this.dateSignalFinish.set(event.value);
    finishDate = event.value;
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
    if (!this.settingsNotNull) {
      return
    }
    this.redrawCharts = true;
    let idx: number = 0;
    for (let tile of this.settings) {
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
    this.redrawCharts = false;
  }

  setChartOptions(): void {
    for (let idx in this.settings) {
      this.tileBoardDesktop[idx] = {
        ...this.tileBoardDesktop[idx],
        Highcharts: null,
        options: {},
      };
      this.tileBoardMobile[idx] = {
        ...this.tileBoardMobile[idx],
        Highcharts: null,
        options: {},
      };
    }
    if (!Boolean(this.data.length)) {
      return
    }
    setTimeout(()=>{
      let idx: number = 0;
      for (let tile of this.settings) {
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
          abscissaValues = [...new Set(this.data.map((item) => item[chartKey]))];
          seriesData = abscissaValues.map((v) => {
            const Val = v;
            return {
              name: Val,
              y: this.data.filter((item) => item[chartKey] === Val).length,
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
            abscissaValues = [...new Set(this.data.map((item) => item[comparedKey]))];
            compareFunc = (a:any, b:any)=>(a === b);
          } else {
            let countby: string = tile.countby ? tile.countby : this.defaultCountBy;
            [mapFunc, compareFunc] = this.getCountByFunctions(countby);
            abscissaValues = this.getCountByDate(mapFunc, countby);
          }

          if (chartKey !== 'birthdate') {
            chartPoints = [...new Set(this.data.map((item) => item[chartKey]))];
          } else {
            let countby: string = tile.countby ? tile.countby : this.defaultCountBy;
            [mapFunc, pointFunc] = this.getCountByFunctions(countby);
            chartPoints = this.getCountByDate(mapFunc, countby);
          }

          for (let point of chartPoints) {
            seriesData = abscissaValues.map((v) => {
              let Val = v;
              return this.data.filter(
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
    }, 10);
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

  getCountByDate(mapFunc: any, countby: CountByType): any[] {
    let axisValues: any[] = [];

    if (this.countByFilter.includes(countby)) {
      axisValues = filteredDates.map(mapFunc);
    } else if (countby !== 'dynamic') {
      let diffYears: number =  countby === 'decades' ? 10 : 100;
      let position: number = filteredDates[0].getFullYear();
      let lastPosition: number = filteredDates[filteredDates.length -1].getFullYear();
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
}
