declare const brandSymbol: unique symbol;

type Brand<T, B extends string> = { readonly [brandSymbol]: B } & T;

type Interval = ReturnType<typeof setInterval>;

type Timeout = ReturnType<typeof setTimeout>;
