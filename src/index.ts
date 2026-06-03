import type {
    NotificationPattern,
    ResultPattern,
    Command,
    Rule,
} from "./types.js";

export type { NotificationPattern, ResultPattern, Command, Rule };

export class SchemaValidator<
    T extends object,
    N extends NotificationPattern = NotificationPattern,
    R extends ResultPattern<T> = ResultPattern<T>,
    C extends object = {},
> implements Command<T, R, C> {
    schema: Rule<T, C>[] = [];
    notificationMappers: (rule: Rule<T, C>, data: T, context: C) => N;
    resultMappers: (data: T, notif: N[]) => R;
    abortEarly: boolean = false;

    constructor({
        schema,
        notificationMappers,
        resultMappers,
        abortEarly,
    }: {
        schema: Rule<T, C>[];
        notificationMappers?: (rule: Rule<T, C>, data: T, context: C) => N;
        resultMappers?: (data: T, notif: N[]) => R;
        abortEarly?: boolean;
    }) {
        this.schema = schema;
        this.notificationMappers =
            notificationMappers ??
            ((rule: Rule<T, C>, data: T, context: C) =>
                ({
                    success: false,
                    key: rule.key,
                    error: rule.error(data, context),
                    description: rule.description?.(data, context),
                }) as N);
        this.resultMappers =
            resultMappers ??
            ((data: T, notif: N[]) =>
                ({
                    data,
                    notification: notif as NotificationPattern[],
                    success: notif.length === 0,
                }) as R);
        this.abortEarly = abortEarly ?? false;
    }

    async validation(data: T, context: C) {
        const notification: N[] = [];
        let currentData: T = data;

        for (const rule of this.schema) {
            if (this.abortEarly && notification.length > 0) {
                break;
            }

            try {
                if (rule.transform) {
                    currentData = await rule.transform(currentData, context);
                }

                const condition =
                    rule.condition &&
                    !(await rule.condition(currentData, context));

                if (condition) {
                    continue;
                }

                const isValid = await rule.runValidate(currentData, context);

                if (!isValid) {
                    notification.push(
                        this.notificationMappers(rule, currentData, context),
                    );
                }
            } catch (error) {
                notification.push(
                    this.notificationMappers(rule, currentData, context),
                );
            }
        }

        return this.resultMappers(currentData, notification);
    }

    async execute(input: T, context: C) {
        return this.validation(input, context);
    }
}
