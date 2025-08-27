import { createAction } from "@reduxjs/toolkit";


export const setAuthLoadingAction = createAction<boolean>('AUTH/SET/LOADING');

export const loginAction = createAction<void>('AUTH/LOGIN');