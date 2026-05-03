import { SchemaValidator } from "../src/index.js";
const validator = new SchemaValidator({
    schema: [
        {
            name: "name",
            code: 1001,
            error: "Nome é obrigatório",
            description: "Verifica se o nome foi fornecido",
            runValidate: (data) => {
                return data.name !== undefined && data.name !== null && data.name.trim().length > 0;
            },
        },
        {
            name: "name",
            code: 1002,
            error: "Nome deve ter no mínimo 3 caracteres",
            description: "Verifica o tamanho mínimo do nome",
            runValidate: (data) => {
                return data.name.length >= 3;
            },
        },
        {
            name: "email",
            code: 1003,
            error: "Email é obrigatório",
            description: "Verifica se o email foi fornecido",
            runValidate: (data) => {
                return data.email !== undefined && data.email !== null && data.email.trim().length > 0;
            },
        },
        {
            name: "email",
            code: 1004,
            error: "Email inválido",
            description: "Valida formato do email",
            runValidate: (data) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(data.email);
            },
        },
        {
            name: "age",
            code: 1005,
            error: "Idade deve ser maior que 0",
            description: "Verifica se idade é positiva",
            runValidate: (data) => {
                return data.age > 0;
            },
        },
    ],
});
const validUser = {
    name: "João",
    email: "joao@example.com",
    age: 25,
};
const invalidUser = {
    name: "Jo",
    email: "invalid-email",
    age: -5,
};
async function main() {
    console.log("=== Validando usuário válido ===");
    const result1 = await validator.execute(validUser);
    console.log("Success:", result1.success);
    console.log("Notifications:", result1.notification);
    console.log("Data:", result1.data);
    console.log("\n=== Validando usuário inválido ===");
    const result2 = await validator.execute(invalidUser);
    console.log("Success:", result2.success);
    console.log("Notifications:", result2.notification);
    console.log("Data:", result2.data);
}
main();
//# sourceMappingURL=user-validation.js.map