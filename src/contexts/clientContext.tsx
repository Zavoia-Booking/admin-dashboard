'use client';

import React, {useContext} from 'react';

export const ClientContext = React.createContext({ data: { user: { role: 'admin' } } });

export function useClientContext() {
    return useContext(ClientContext);
}