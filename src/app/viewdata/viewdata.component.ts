import { ChartData, NamesTypeOfChart } from './../data/interfaces/data.interface';
import { Axes, AxesNames, Axis, ChartSettings, ColorPalette, ColorScheme, CountByType, DefaultCountBy } from './../data/interfaces/chart.interface';
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
  private countByFilter: string[] = ['days', 'months', 'years'];
  private dataStore = inject(DataStore);
  private settingsStore = inject(SettingsStore);
  settings: ChartSettings[] = [];
  data: ChartData[] = [];
  tileSetMobile: ChartTile[] = [];
  tileSetDesktop: ChartTile[] = [];
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
        this.initializeDates();
        this.filterData();
        this.initializeDates(this.data);
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

  filterData(): void {
    let from = this.dateSignalStart();
    let to = this.dateSignalFinish();
    if (from != null && to != null) {
      this.dataStore.selectManyByPredicate(
          (entity: any) => entity.birthdate >= from && entity.birthdate <= to
        )
        .subscribe((val) => {
          this.data = val;
          this.setChartOptions();
        });
    } else {
      this.dataStore.getAllStoreData().subscribe((val) => {
        this.data = val;
      });
    }
  }

  initializeDates(data?: ChartData[]): void {
    if (data !== undefined) {
      let filteredDates: Date[] = this.setFilteredDates(data);
      minDateOfData = minDateOfData || filteredDates[0];
      maxDateOfData = maxDateOfData || filteredDates[filteredDates.length - 1];
      startDate = startDate || minDateOfData;
      finishDate = finishDate || maxDateOfData;
    }
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
    this.tileSetMobile = [];
    this.tileSetDesktop = [];
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
      this.tileSetMobile[idx] = tileMobile;
      let tileDesktop: ChartTile = {
        Highcharts: null,
        options: {},
        cols: tile.wide ? 2 : 1,
        rows: tile.tall ? 2 : 1,
        type: 'desk',
      };
      this.tileSetDesktop[idx] = tileDesktop;
      ++idx;
    }
    this.redrawCharts = false;
  }

  isSimpleChart(tile: ChartSettings): boolean{
    return tile.axes.length === 1 ||
      (
        tile.axes.includes('birthdate') &&
        tile.countby === 'for all time'
      )
  }

  fillAxes(tile: ChartSettings, abscissaValues: any[], chartKey: NamesTypeOfChart, comparedKey: NamesTypeOfChart): Axes {
    let axes: Axes = {};
    if (tile.axes.length > 1) {
      let axisLabel = this.isSimpleChart(tile) ? chartKey : comparedKey;
      axes.xAxis = {
        title: { text: this.Capitalize(axisLabel) },
        categories: abscissaValues,
      };
      if (!this.isSimpleChart(tile)) {
        axes.yAxis = {
          title: { text: 'Values' },
        };
      }
    }
    return axes
  }

  fillSimpleSeries(tile: ChartSettings, abscissaValues: any[], chartKey: NamesTypeOfChart): object {
    let series: object = {};
    let seriesData: any[] = [];
    seriesData = abscissaValues.map((v) => {
      const Val = v;
      return {
        name: Val,
        y: this.data.filter((item) => item[chartKey] === Val).length,
      };
    });
    series = {
      type: tile.type,
      name: this.Capitalize(chartKey),
      data: seriesData,
    };
    return series
  }

  getAbscissaValues(tile: ChartSettings, filteredDates: Date[], comparedKey: NamesTypeOfChart): [any[], Function] {
    let abscissaValues: any[];
    let mapFunc: Function;
    let compareFunc: Function;

    if (comparedKey !== 'birthdate') {
      abscissaValues = [...new Set(this.data.map((item) => item[comparedKey]))];
      compareFunc = (a:any, b:any)=>(a === b);
    } else {
      let countby: string = tile.countby ? tile.countby : this.defaultCountBy;
      [mapFunc, compareFunc] = this.getCountByFunctions(countby);
      abscissaValues = this.getCountByDate(mapFunc, countby, filteredDates);
    }
    return [abscissaValues, compareFunc]
  }

  getChartPoints(tile: ChartSettings, filteredDates: Date[], chartKey: NamesTypeOfChart): [any[], Function] {
    let chartPoints: any[];
    let mapFunc: Function;
    let pointFunc: Function = (a:any, b:any)=>(a === b);

    if (chartKey !== 'birthdate') {
      chartPoints = [...new Set(this.data.map((item) => item[chartKey]))];
    } else {
      let countby: string = tile.countby ? tile.countby : this.defaultCountBy;
      [mapFunc, pointFunc] = this.getCountByFunctions(countby);
      chartPoints = this.getCountByDate(mapFunc, countby, filteredDates);
    }
    return [chartPoints, pointFunc]
  }

  fillComplexSeries(tile: ChartSettings, chartKey: NamesTypeOfChart, comparedKey: NamesTypeOfChart): any[]{
    let seriesData: number[];
    let series: object[] = [];
    let abscissaValues: any[];
    let chartPoints: any[];
    let compareFunc: Function;
    let pointFunc: Function;
    let filteredDates: Date[] = this.setFilteredDates(this.data);

    [abscissaValues, compareFunc] = this.getAbscissaValues(tile, filteredDates, comparedKey);
    [chartPoints, pointFunc] = this.getChartPoints(tile, filteredDates, chartKey);

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
    return series
  }

  fillColorSchema(axes: Axes, tile: ChartSettings): Axes {
    if (tile.colors && tile.colors !== 'default') {
      ColorPalette.map((v: ColorScheme)=>{if (v.title === tile.colors) axes.colors = v.colors});
    }
    return axes
  }

  setChartOptions(): void {
    for (let idx in this.settings) {
      this.tileSetDesktop[idx] = {
        ...this.tileSetDesktop[idx],
        Highcharts: null,
        options: {},
      };
      this.tileSetMobile[idx] = {
        ...this.tileSetMobile[idx],
        Highcharts: null,
        options: {},
      };
    }
    if (!Boolean(this.data.length)) {
      return
    }
    setTimeout(()=>{ // TODO: find something better than timeout function
      let idx: number = 0;
      for (let tile of this.settings) {
        let axes: Axes = {};
        let series: any = [];
        let abscissaValues: any[] = [];
        let chartKey: NamesTypeOfChart = tile.axes.length === 1 ? tile.axes[0] : tile.axes[1];
        let comparedKey: NamesTypeOfChart = tile.axes[0];
        

        if (this.isSimpleChart(tile)) {
          chartKey = tile.axes.length === 1 ? tile.axes[0] : tile.axes[1];
          abscissaValues = [...new Set(this.data.map((item) => item[chartKey]))];
          series.push(this.fillSimpleSeries(tile, abscissaValues, chartKey));
        } else {
          series = this.fillComplexSeries(tile, chartKey, comparedKey);
        }

        axes = this.fillAxes(tile, abscissaValues, chartKey, comparedKey);

        axes = this.fillColorSchema(axes, tile);

        let chartOptions: Highcharts.Options = {
          chart: { type: tile.type },
          title: { text: tile.title },
          subtitle: { text: tile.subtitle ? tile.subtitle : '' },
          accessibility: { enabled: false },
          ...axes,
          series: series,
        };
        this.tileSetDesktop[idx] = {
          ...this.tileSetDesktop[idx],
          Highcharts: Highcharts,
          options: chartOptions,
        };
        this.tileSetMobile[idx] = {
          ...this.tileSetMobile[idx],
          Highcharts: Highcharts,
          options: chartOptions,
        };
        ++idx;
      }
    }, 10);
  }

  getCountByFunctions(countby: CountByType): Function[] {
    let parseFunc: Function;
    let mapFunc: Function = ()=>{};
    let compareFunc: Function = ()=>{};

    if (this.countByFilter.includes(countby)) {
      parseFunc = String;
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
    } // else {} TODO: dynamic

    return [mapFunc, compareFunc]
  }

  getCountByDate(mapFunc: any, countby: CountByType, filteredDates: Date[]): any[] {
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
    } // else {}TODO: dynamic

    return axisValues
  }

  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return this.tileSetMobile;
      }
      return this.tileSetDesktop;
    })
  );
}
