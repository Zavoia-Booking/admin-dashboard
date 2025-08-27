import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import authReducer from "../../features/auth/reducer";

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
        reducer: {
            auth: authReducer,
        },
        middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: false,
        }).concat(sagaMiddleware),
        devTools: process.env.NODE_ENV !== 'production'
    }
)

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;