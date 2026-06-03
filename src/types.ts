export interface NotificationPattern {
    success: boolean;
    key: string | number | symbol;
    error: string;
    description?: string;
}

export interface ResultPattern<T> {
    success: boolean;
    notification: NotificationPattern[];
    data: T;
}

export interface Rule<T, C> {
    key: keyof T;
    error: (data: T, context: C) => string;
    transform?: (data: T, context: C) => T | Promise<T>;
    condition?: (data: T, context: C) => boolean | Promise<boolean>;
    runValidate(data: T, context: C): boolean | Promise<boolean>;
    description?: (data: T, context: C) => string;
}

export interface Command<T extends object, R extends object, C extends object> {
    execute(data: T, context: C): Promise<R>;
}
