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
> implements Command<T, R> {
    schema: Rule<T>[] = [];
    notificationMappers: (rule: Rule<T>, data: T) => N;
    resultMappers: (data: T, notif: N[]) => R;
    abortEarly: boolean = false;

    constructor({
        schema,
        notificationMappers,
        resultMappers,
        abortEarly,
    }: {
        schema: Rule<T>[];
        notificationMappers?: (rule: Rule<T>, data: T) => N;
        resultMappers?: (data: T, notif: N[]) => R;
        abortEarly?: boolean;
    }) {
        this.schema = schema;
        this.notificationMappers =
            notificationMappers ??
            ((rule: Rule<T>, data: T) =>
                ({
                    success: false,
                    key: rule.key,
                    error: rule.error(data),
                    description: rule.description ?? "",
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

    async validation(data: T) {
        const notification: N[] = [];
        let currentData: T = data;

        for (const rule of this.schema) {
            if (this.abortEarly && notification.length > 0) {
                break;
            }

            try {
                if (rule.transform) {
                    currentData = await rule.transform(currentData);
                }

                const condition =
                    rule.condition && !(await rule.condition(currentData));

                if (condition) {
                    continue;
                }

                const isValid = await rule.runValidate(currentData);

                if (!isValid) {
                    notification.push(
                        this.notificationMappers(rule, currentData),
                    );
                }
            } catch (error) {
                notification.push(this.notificationMappers(rule, currentData));
            }
        }

        return this.resultMappers(currentData, notification);
    }

    async execute(input: T) {
        return this.validation(input);
    }
}
