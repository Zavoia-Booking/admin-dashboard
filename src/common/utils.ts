import {createAction} from "@reduxjs/toolkit";

export const createRequestAction = (base: string) => {
    return {
        request: createAction(`${base}/REQUEST`),
        success: createAction(`${base}/SUCCESS`),
        failure: createAction(`${base}/FAILURE`),
    };
}