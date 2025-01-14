import { namesOfFields } from "./data.interface";

export const TypesOfChart = [
  'line',
  'column',
  'pie',
  'area',
  'spline',
] as const;
export type ChartType = (typeof TypesOfChart)[number];

type AxisesNames = (typeof namesOfFields)[number];

export interface ChartSettings {
  id: number;
  title: string;
  subtitle: string | null;
  type: ChartType;
  axises: AxisesNames[];
  wide?: boolean;
  tall?: boolean;
}

export const defaultChartSettings: ChartSettings[] = [
  {
    id: 1,
    title: 'Default Chart',
    subtitle: 'Default Chart',
    type: 'line',
    wide: true,
    axises: ['all', 'birthday'],
  },
  {
    id: 3,
    title: 'Gender Chart',
    subtitle: null,
    type: 'pie',
    wide: false,
    axises: ['sex' ],
  },
  {
    id: 2,
    title: 'Blood Group Chart',
    subtitle: null,
    type: 'column',
    wide: false,
    tall: true,
    axises: ['blood_group', 'birthday',],
  },
  {
    id: 4,
    title: 'Job Chart',
    subtitle: null,
    type: 'spline',
    wide: false,
    axises: ['job'],
  },
];
