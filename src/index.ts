import type {
    NotificationPattern,
    ResultPattern,
    Command,
    Rule,
} from "./types.js";

export class SchemaValidator<T extends object> implements Command<T> {
    schema: Rule<T>[] = [];

    constructor({ schema }: { schema: Rule<T>[] }) {
        this.schema = schema;
    }

    async validation(data: T) {
        const notification: NotificationPattern[] = [];
        for (const rule of this.schema) {
            try {
                const isValid = await rule.runValidate(data);
                if (!isValid) {
                    notification.push({
                        name: rule.name,
                        success: false,
                        error: rule.error,
                        code: rule.code,
                        description: rule.description,
                    });
                }
            } catch (error) {
                notification.push({
                    name: rule.name,
                    success: false,
                    error: rule.error,
                    code: rule.code,
                    description: rule.description,
                });
            }
        }

        return {
            success: notification.length === 0,
            notification,
            data: data,
        };
    }

    async execute(input: T) {
        return this.validation(input);
    }
}
