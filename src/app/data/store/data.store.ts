import { Injectable } from '@angular/core';
import { ChartData } from './../interfaces/data.interface';
import { abStore } from "./abstract.store";
import { selectManyByPredicate } from '@ngneat/elf-entities';

@Injectable({ providedIn: 'root' })
export class DataStore extends abStore<ChartData>{
  constructor() {
    super('dataStore');
  }

  beforeUpload(data: ChartData[]): ChartData[] {
    data = data.map((val) => {
      val.birthdate = new Date(val.birthdate);
      val.all = 'all';
      return val;
    });
    return data
  }

  selectManyByPredicate(predicate: any) {
    return this.store
          .pipe<ChartData[] | []>(selectManyByPredicate(predicate));
  }
}
