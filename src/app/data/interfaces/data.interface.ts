export const namesOfFields = [
  'all',
  'sex',
  'blood_group',
  'job',
  'company',
  'birthday',
];

export interface ChartData {
  id: number;
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
