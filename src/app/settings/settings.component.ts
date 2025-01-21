import * as _ from 'lodash';
import { CountBy, ChartSettings, TypesOfChart, AxesNames, DefaultCountBy, ColorNames, ColorPalette } from './../data/interfaces/chart.interface';
import { selectAllEntities } from '@ngneat/elf-entities';
import { Component, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { deleteSettingItem, settingsStore, upsertSettingItem } from '../data/store/chart.store';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray, } from '@angular/forms';
import { Dialog, DIALOG_DATA, DialogModule, DialogRef, } from '@angular/cdk/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NamesOfFields } from '../data/interfaces/data.interface';
import { BehaviorSubject, Observable } from 'rxjs';

let settings: ChartSettings[] = [],
  settingsLastUpdated: number = 0,
  redraw = new BehaviorSubject<boolean>(true);

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  standalone: true,
  imports: [
    AsyncPipe,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    DialogModule,
  ],
})
export class SettingsComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private settingsUpdated: number = 0;
  settings: ChartSettings[] = [];
  defaultCountBy = DefaultCountBy;
  dialog = inject(Dialog);

  constructor() {
    redraw.next(true);
  }

  checkToRedraw(): Observable<boolean> {
    return redraw.asObservable();
  }

  getSettings() {
    if (settingsLastUpdated < this.settingsUpdated) {
      settingsStore
        .pipe<ChartSettings[] | []>(selectAllEntities())
        .subscribe((val) => {
          settings = val;
        });
      settingsLastUpdated = this.settingsUpdated;
      redraw.next(false);
    }
  }

  openDialog(item?: ChartSettings) {
    let data = {};
    if (item) {
      data = _.cloneDeep(item);
    } else {
      data = {
        id: 0,
        title: '',
        subtitle: '',
        type: null,
        countby: null,
        colors: null,
        axes: ['', ''],
      };
    }
    this.dialog.open(FormComponent, {
      data: {
        h1: item?.id ? 'Change Chart' : 'Add Chart',
        ...data,
      },
    });
  }

  bp$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) { return 2; }
      return 0;
    })
  );

  checker = this.checkToRedraw().subscribe(res => {
    if (res) {
      settingsStore.subscribe((state) => {
        this.settingsUpdated = state.updated;
        this.getSettings();
        this.settings = settings;
      });
    }
  });
}

@Component({
  selector: 'app-settings-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css',
})
export class FormComponent {
  data = inject(DIALOG_DATA);
  dialogRef = inject(DialogRef);
  form = new FormGroup({
    title: new FormControl(this.data.title, Validators.required),
    subtitle: new FormControl(this.data.subtitle),
    type: new FormControl(this.data.type, Validators.required),
    axes: new FormArray([new FormControl('', Validators.required)]),
    countby: new FormControl(this.data.countby),
    wide: new FormControl(this.data.wide),
    tall: new FormControl(this.data.tall),
    remove: new FormControl(false),
    colors: new FormControl(this.data.colors),
  });
  typesOfChart = TypesOfChart;
  listOfTargets = NamesOfFields;
  axesNames = AxesNames;
  countBy = CountBy;
  selects: string[] = this.data.axes || [];
  minAxesNumber: number = this.data.type ==='pie' ? 1 : 2;
  dialog = inject(Dialog);
  colorPalette = ColorPalette;

  setAxesLength(value: string) {
    this.minAxesNumber = value === 'pie' ? 1 : 2;
  }

  makeAxesArray(): FormArray {
    this.form.controls['axes'].clear();
    if (this.data.axes) {
      for (let axis of this.data.axes) {
        this.form.controls['axes'].push(
          new FormControl(axis, Validators.required)
        );
      }
    }
    let axesLength = this.form.controls['axes'].length;
    if (axesLength < this.minAxesNumber) {
      for (let i = axesLength; i < this.minAxesNumber; i++) {
        this.form.controls['axes'].push(
          new FormControl('', Validators.required)
        );
      }
    } else if (axesLength > this.minAxesNumber) {
      this.form.controls['axes'].removeAt(this.minAxesNumber);
    }
    return this.form.controls['axes'] as FormArray;
  }

  onChange(value: string, index: number) {
    this.selects[index] = value;
  }

  checkDisabled(index:number, value: string): boolean {
    let result: boolean = this.selects
                            .slice(0, this.minAxesNumber)
                            .filter((v, i, a) => i !== index)
                            .includes(value);
    return result;
  }

  onSubmit() {
    if (this.form.value.remove) {
      this.dialogRef.close();
      this.dialog.open(ConfirmComponent, {
        data: {
          h1: 'Remove Chart',
          id: this.data.id,
          text: `Are you going to remove the chart "${this.form.value.title}"?`,
        },
      });
      return
    }

    if (this.form.valid) {
      let data: ChartSettings = {
        id: this.data.id,
        title: this.form.value.title,
        subtitle: this.form.value.subtitle ? this.form.value.subtitle: null,
        type: this.form.value.type,
        axes: this.form.value.axes ? this.form.value.axes : [],
        countby: this.form.value.countby ? this.form.value.countby : null,
        wide: this.form.value.wide ? this.form.value.wide : null,
        tall: this.form.value.tall ? this.form.value.tall : null,
        colors: this.form.value.colors ? this.form.value.colors : null,
      }
      redraw.next(upsertSettingItem(this.data.id, data))
      this.dialogRef.close();
    }
  }
}

@Component({
  selector: 'app-settings-form',
  imports: [
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './confirm.component.html',
  styleUrl: './confirm.component.css',
})
export class ConfirmComponent {
  data = inject(DIALOG_DATA);
  dialogRef = inject(DialogRef);

  onAgree() {
    redraw.next(deleteSettingItem(this.data.id));
    this.dialogRef.close();
  }
}
