import { CodigoStatus } from "./enum.js";

export interface NotificationPattern {
    statusText: keyof typeof CodigoStatus | number;
    success: boolean;
    name: string | number | symbol;
    error: string;
    description: string;
}

export interface ResultPattern<T> {
    success: boolean;
    notification: NotificationPattern[];
    data: T;
}

export interface Rule<T> {
    name: keyof T;
    statusText: keyof typeof CodigoStatus | number;
    error: string;
    runValidate(data: T): boolean | Promise<boolean>;
    description: string;
}

export interface Command<T extends object, R extends object> {
    execute(data: T): Promise<R>;
}
