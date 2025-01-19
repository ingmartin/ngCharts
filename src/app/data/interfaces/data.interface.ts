export const NamesOfFields = [
  'all',
  'sex',
  'blood_group',
  'job',
  'company',
  'birthdate',
] as const;
export type NamesOfType = (typeof NamesOfFields)[number];

export interface ChartData {
  id: number;
  all: string;
  name: string;
  birthdate: Date;
  blood_group: string;
  sex: string;
  job: string;
  company: string;
}

export interface JobList {
  job: string;
  count: number;
}
