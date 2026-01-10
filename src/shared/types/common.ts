export enum FilterOperator {
    CONTAINS = 'CONTAINS',
    EQUALS = 'EQUALS',
    LTE = 'LTE',
    GTE = 'GTE',
}

export type FilterItem = {
    field: string,
    operator: FilterOperator,
    value: string | number | boolean
}