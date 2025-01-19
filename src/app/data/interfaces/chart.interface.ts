export const TypesOfChart = [
  'bar',
  'line',
  'column',
  'pie',
  'area',
  'spline',
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

export const AxisesNames = ['x', 'y', 'z'];

export interface ChartSettings {
  id: number;
  title: string;
  subtitle: string | null;
  type: ChartType;
  axises: any[];
  countby?: CountByType; 
  wide?: boolean;
  tall?: boolean;
}

export const defaultChartSettings: ChartSettings[] = [
  {
    id: 1,
    title: 'Default Chart',
    subtitle: 'Default Chart',
    type: 'spline',
    wide: true,
    axises: ['birthdate', 'blood_group',],
    countby: 'decades',
  },
  {
    id: 3,
    title: 'Gender Chart',
    subtitle: null,
    type: 'column',
    axises: ['birthdate', 'sex',],
    countby: 'decades',
  },
  {
    id: 2,
    title: 'Blood Group Chart',
    subtitle: null,
    type: 'pie',
    axises: ['birthdate', 'blood_group',],
    countby: 'for all time',
  },
  {
    id: 4,
    title: 'Job Chart',
    subtitle: null,
    type: 'bar',
    wide: true,
    tall: true,
    axises: ['birthdate', 'job',],
    countby: 'for all time',
  },
];
