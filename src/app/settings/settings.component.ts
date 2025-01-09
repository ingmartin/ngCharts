import { selectAllEntities } from '@ngneat/elf-entities';
import { Component, inject } from '@angular/core';
import { ChartSettings, TypesOfChart } from '../data/interfaces/chart.interface';
import { settingsStore } from '../data/store/chart.store';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {Dialog, DIALOG_DATA, DialogModule, DialogRef} from '@angular/cdk/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

let settings: ChartSettings[] = [],
    settingsLastUpdated: number = 0;

@Component({
  selector: 'app-settings',
  imports: [
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    DialogModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  private settingsUpdated: number = 0;
  settings: ChartSettings[] = [];
  dialog = inject(Dialog);
  
  constructor() {
    settingsStore.subscribe((state) => {
      this.settingsUpdated = state.updated;
      this.getSettings();
      this.settings = settings;
    });
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
  openForm(item?: ChartSettings) {
    this.dialog.open(FormComponent, {
      data: {
        h1: item?.title ? 'Change Chart' : 'Add Chart',
        ...item
      }
    });
  }
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
  styleUrl: './form.component.css'
})
export class FormComponent {
  data = inject(DIALOG_DATA);
  dialogRef = inject(DialogRef);
  form = new FormGroup({
    title: new FormControl(this.data.title ? this.data.title : null, Validators.required),
    subtitle: new FormControl(this.data.subtitle ? this.data.subtitle : null),
    type: new FormControl(this.data.type ? this.data.type : null, Validators.required),
    wide: new FormControl(this.data.wide),
    tall: new FormControl(this.data.tall),
  });
  types_of_chart = TypesOfChart;

  onSubmit() {
    console.log(this.form.value);
  }
}
