import type { ServiceFilterState } from "./types.ts";
import { ALL } from "../../shared/constants.ts";
import { type FilterItem, FilterOperator } from "../../shared/types/common.ts";

export const getDefaultServiceFilters = (): ServiceFilterState => {
    return {
        searchTerm: '',
        status: ALL,
        durationMin:'',
        durationMax:'',
        priceMin:'',
        priceMax: ''
    }
}

export const mapToGenericFilter = (filters: ServiceFilterState): Array<FilterItem> => {
    const serverFilters: Array<FilterItem> = [];

    const { searchTerm, priceMax, priceMin, durationMax, durationMin } = filters;

    if (searchTerm) {
        serverFilters.push({
            field: 'service.name',
            operator: FilterOperator.CONTAINS,
            value: searchTerm
        })
    }

    if (priceMax) {
        serverFilters.push({
            field: 'service.price',
            operator: FilterOperator.LTE,
            value: +priceMax
        })
    }

    if (priceMin) {
        serverFilters.push({
            field: 'service.price',
            operator: FilterOperator.GTE,
            value: +priceMin
        })
    }

    if (durationMax) {
        serverFilters.push({
            field: 'service.duration',
            operator: FilterOperator.LTE,
            value: +durationMax
        })
    }

    if (durationMin) {
        serverFilters.push({
            field: 'service.duration',
            operator: FilterOperator.GTE,
            value: +durationMin
        })
    }
    
    return serverFilters;
}