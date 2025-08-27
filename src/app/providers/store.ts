import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "./sagas";
import authReducer from "../../features/auth/reducer";
import setupWizardReducer from "../../features/setupWizard/reducer";
import teamMembersReducer from "../../features/teamMembers/reducer";

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
        reducer: {
            auth: authReducer,
            setupWizard: setupWizardReducer,
            teamMembers: teamMembersReducer,
        },
        middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: false,
        }).concat(sagaMiddleware),
        devTools: import.meta.env.DEV
    }
)

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;