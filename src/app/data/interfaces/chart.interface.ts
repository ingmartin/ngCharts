export interface Axes {
    title: string,
    target: string
}

export interface ChartSettings {
    id: number,
    title: string,
    subtitle: string | null,
    type: string,
    axis: Axes[],
    wide?: boolean,
    tall?: boolean,
}

export let defaultChartSettings: ChartSettings[] = [
    {
        id: 1,
        title: 'Default Chart',
        subtitle: 'Default Chart',
        type: 'line',
        wide: true,
        axis: [
        { title: 'X-Axis', target: 'x' },
        { title: 'Y-Axis', target: 'birthday' }
        ]
    },
    {
        id: 2,
        title: 'Blood Group Chart',
        subtitle: null,
        type: 'column',
        wide: false,
        tall: true,
        axis: [
        { title: 'X-Axis', target: 'blood_grtoup' },
        { title: 'Y-Axis', target: 'birthday' }
        ]
    },
    {
        id: 3,
        title: 'Sex Chart',
        subtitle: null,
        type: 'pie',
        wide: false,
        axis: [
        { title: 'X-Axis', target: 'sex' }
        ]
    },
    {
        id: 4,
        title: 'Job Chart',
        subtitle: null,
        type: 'pie',
        wide: false,
        axis: [
        { title: 'X-Axis', target: 'sex' }
        ]
    },
]