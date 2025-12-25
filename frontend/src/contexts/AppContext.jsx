import React, { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const value = useMemo(
        () => ({
            user,
            setUser,
        }),
        [user]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
    return ctx;
};
