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

export interface Rule<T> {
    key: keyof T;
    error: (data: T) => string;
    transform?: (data: T) => T | Promise<T>;
    condition?: (data: T) => boolean | Promise<boolean>;
    runValidate(data: T): boolean | Promise<boolean>;
    description?: string;
}

export interface Command<T extends object, R extends object> {
    execute(data: T): Promise<R>;
}
