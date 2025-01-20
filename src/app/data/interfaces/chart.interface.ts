export const TypesOfChart = [
  'bar',
  'line',
  'column',
  'pie',
  'area',
  'spline',
  // TODO: 'drilldown'
] as const;
export type ChartType = (typeof TypesOfChart)[number];

export const CountBy = [
  // TODO: 'dynamic',
  'days',
  'months',
  'years',
  'decades',
  'centuries',
  'for all time',
]
export type CountByType = (typeof CountBy)[number];
export const DefaultCountBy: CountByType = 'decades';
export const ColorNames = [
  'default',
  'monochrome',
  'red',
  'orange',
  'green',
  'darkgreen',
  'blue',
  'darkblue',
]
export type ColorNamesType = (typeof ColorNames)[number];
export interface ColorScheme {
  title: ColorNamesType;
  colors: string[];
}

export const AxesNames = ['x', 'y', 'z'];

export interface ChartSettings {
  id: number;
  title: string;
  subtitle: string | null;
  type: ChartType;
  axes: any[];
  countby?: CountByType;  
  wide?: boolean;
  tall?: boolean;
  colors?: ColorNamesType;
}

export const ColorPalette: ColorScheme[] = [
  { title: 'default', colors:[] },
  { title: 'monochrome', colors:['#222', '#777', '#444', '#888', '#333'] },
  { title: 'red', colors:['#FF530D', '#E82C0C', '#FF0000', '#E80C7A', '#E80C7A'] },
  { title: 'orange', colors:['#DD8600', '#DDAA44', '#FF8600', '#BD8600', '#FF9A44'] },
  { title: 'green', colors:['#008600', '#22AA44', '#44A600', '#418600', '#669A44'] },
  { title: 'darkgreen', colors:['#154033', '#333E0B', '#0B341F', '#253B1E', '#222F1E'] },
  { title: 'blue', colors:['#02A9F1', '#42DDE7', '#02CCF1', '#00D1CC', '#5AAFD1'] },
  { title: 'darkblue', colors:['#08068E', '#393978', '#0A0063', '#010039', '#221C4B'] },
]

export const defaultChartSettings: ChartSettings[] = [
  {
    id: 1,
    title: 'Default Chart',
    subtitle: 'Default Chart',
    type: 'spline',
    wide: true,
    axes: ['birthdate', 'blood_group',],
    countby: 'decades',
  },
  {
    id: 3,
    title: 'Gender Chart',
    subtitle: null,
    type: 'column',
    axes: ['birthdate', 'sex',],
    countby: 'decades',
  },
  {
    id: 2,
    title: 'Blood Group Chart',
    subtitle: null,
    type: 'pie',
    axes: ['blood_group',],
  },
  {
    id: 4,
    title: 'Job Chart',
    subtitle: null,
    type: 'bar',
    wide: true,
    tall: true,
    axes: ['birthdate', 'job',],
    countby: 'for all time',
  },
];
