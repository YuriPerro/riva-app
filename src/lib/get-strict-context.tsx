import * as React from "react";

interface StrictProviderProps<T> {
  value: T;
  children?: React.ReactNode;
}

function getStrictContext<T>(name = "a Provider") {
  const Context = React.createContext<T | undefined>(undefined);

  const Provider = (props: StrictProviderProps<T>) => (
    <Context.Provider value={props.value}>{props.children}</Context.Provider>
  );

  const useSafeContext = () => {
    const ctx = React.useContext(Context);
    if (ctx === undefined) {
      throw new Error(`useContext must be used within ${name}`);
    }
    return ctx;
  };

  return [Provider, useSafeContext] as const;
}

export { getStrictContext };
