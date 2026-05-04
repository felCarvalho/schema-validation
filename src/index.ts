import type {
    NotificationPattern,
    ResultPattern,
    Command,
    Rule,
} from "./types.js";

export class SchemaValidator<
    T extends object,
    N extends object = NotificationPattern,
    R extends object = ResultPattern<T>,
> implements Command<T, R> {
    schema: Rule<T>[] = [];
    notificationMappers: (rule: Rule<T>) => N;
    resultMappers: (data: T, notif: N[]) => R;

    constructor({
        schema,
        notificationMappers,
        resultMappers,
    }: {
        schema: Rule<T>[];
        notificationMappers: (rule: Rule<T>) => N;
        resultMappers: (data: T, notif: N[]) => R;
    }) {
        this.schema = schema;
        this.notificationMappers = notificationMappers;
        this.resultMappers = resultMappers;
    }

    async validation(data: T) {
        const notification: N[] = [];
        for (const rule of this.schema) {
            try {
                const isValid = await rule.runValidate(data);
                if (!isValid) {
                    notification.push(this.notificationMappers(rule));
                }
            } catch (error) {
                notification.push(this.notificationMappers(rule));
            }
        }

        return this.resultMappers(data, notification);
    }

    async execute(input: T) {
        return this.validation(input);
    }
}
