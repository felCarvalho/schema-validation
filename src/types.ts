export interface NotificationPattern {
    success: boolean;
    name: string | number | symbol;
    error: string;
    description?: string;
}

export interface ResultPattern<T> {
    success: boolean;
    notification: NotificationPattern[];
    data: T;
}

export interface Rule<T> {
    name: keyof T;
    error: string;
    runValidate(data: T): boolean | Promise<boolean>;
    description?: string;
}

export interface Command<T extends object, R extends object> {
    execute(data: T): Promise<R>;
}
