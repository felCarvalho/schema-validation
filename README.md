# schemaValidation

Biblioteca de validação simples, leve e agnóstica com NotificationPattern e ResultPattern para respostas padronizadas.

## Instalação

```bash
npm install @felca/schema-validation
```

## Uso Básico

```typescript
import { SchemaValidator } from "@felca/schema-validation";

interface User {
    name: string;
    email: string;
    age: number;
}

const validator = new SchemaValidator<User>({
    schema: [
        {
            name: "name",
            code: 1001,
            error: "Nome é obrigatório",
            description: "Verifica se o nome foi fornecido",
            runValidate: (data: User) => data.name.trim().length > 0,
        },
        {
            name: "email",
            code: 1002,
            error: "Email inválido",
            description: "Valida formato do email",
            runValidate: (data: User) =>
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
    ],
});

const result = await validator.execute({
    name: "João",
    email: "joao@example.com",
    age: 25,
});

console.log(result.success); // true
console.log(result.notification); // []
```

## Exemplos de Validação

### Validação de objetos aninhados

```typescript
interface Address {
    street: string;
    city: string;
    zipCode: string;
}

interface User {
    name: string;
    address: Address;
}

const addressValidator = new SchemaValidator<Address>({
    schema: [
        {
            name: "street",
            code: 2001,
            error: "Rua é obrigatória",
            runValidate: (data) => data.street.length > 0,
        },
        {
            name: "zipCode",
            code: 2002,
            error: "CEP inválido",
            runValidate: (data) => /^\d{5}-\d{3}$/.test(data.zipCode),
        },
    ],
});

const userValidator = new SchemaValidator<User>({
    schema: [
        {
            name: "name",
            code: 1001,
            error: "Nome é obrigatório",
            runValidate: (data) => data.name.trim().length > 0,
        },
        {
            name: "address",
            code: 1002,
            error: "Endereço inválido",
            runValidate: async (data) => {
                const result = await addressValidator.execute(data.address);
                return result.success;
            },
        },
    ],
});
```

### Validação异步

```typescript
interface LoginData {
    email: string;
    password: string;
}

const loginValidator = new SchemaValidator<LoginData>({
    schema: [
        {
            name: "email",
            code: 3001,
            error: "Email é obrigatório",
            runValidate: (data) => !!data.email,
        },
        {
            name: "password",
            code: 3002,
            error: "Senha deve ter pelo menos 8 caracteres",
            runValidate: (data) => data.password.length >= 8,
        },
        {
            name: "verify",
            code: 3003,
            error: "Usuário não existe",
            runValidate: async (data) => {
                const response = await fetch("/api/verify-user", {
                    method: "POST",
                    body: JSON.stringify({ email: data.email }),
                });
                return response.ok;
            },
        },
    ],
});
```

### Validação condicional

```typescript
interface FormData {
    type: "individual" | "company";
    cpf: string;
    cnpj: string;
    companyName: string;
}

const formValidator = new SchemaValidator<FormData>({
    schema: [
        {
            name: "type",
            code: 4001,
            error: "Tipo inválido",
            runValidate: (data) =>
                ["individual", "company"].includes(data.type),
        },
        {
            name: "cpf",
            code: 4002,
            error: "CPF inválido",
            runValidate: (data) => {
                if (data.type === "individual") {
                    return /^\d{11}$/.test(data.cpf);
                }
                return true;
            },
        },
        {
            name: "cnpj",
            code: 4003,
            error: "CNPJ inválido",
            runValidate: (data) => {
                if (data.type === "company") {
                    return /^\d{14}$/.test(data.cnpj);
                }
                return true;
            },
        },
        {
            name: "companyName",
            code: 4004,
            error: "Razão social obrigatória",
            runValidate: (data) => {
                if (data.type === "company") {
                    return data.companyName.length > 0;
                }
                return true;
            },
        },
    ],
});
```

### Validação de arrays

```typescript
interface Product {
    name: string;
    price: number;
}

interface Order {
    items: Product[];
}

const orderValidator = new SchemaValidator<Order>({
    schema: [
        {
            name: "items",
            code: 5001,
            error: "Pedido vazio",
            runValidate: (data) => data.items.length > 0,
        },
        {
            name: "items",
            code: 5002,
            error: "Produto sem nome",
            runValidate: (data) =>
                data.items.every((item) => item.name.trim().length > 0),
        },
        {
            name: "items",
            code: 5003,
            error: "Preço inválido",
            runValidate: (data) =>
                data.items.every((item) => item.price > 0),
        },
    ],
});
```

### Regras reutilizáveis

```typescript
interface User {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const isRequired = (field: keyof User, code: number) => ({
    name: field,
    code,
    error: `${String(field)} é obrigatório`,
    description: `Verifica se ${String(field)} foi fornecido`,
    runValidate: (data: User) => {
        const value = data[field];
        return typeof value === "string" ? value.trim().length > 0 : !!value;
    },
});

const isEmail = (code: number) => ({
    name: "email",
    code,
    error: "Email inválido",
    description: "Valida formato do email",
    runValidate: (data: User) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
});

const minLength = (field: keyof User, min: number, code: number) => ({
    name: field,
    code,
    error: `${String(field)} deve ter pelo menos ${min} caracteres`,
    description: `Verifica mínimo de ${min} caracteres`,
    runValidate: (data: User) => {
        const value = data[field];
        return typeof value === "string" ? value.length >= min : false;
    },
});

const passwordsMatch = {
    name: "confirmPassword",
    code: 6004,
    error: "Senhas não conferem",
    description: "Confirmação de senha deve ser igual à senha",
    runValidate: (data: User) => data.password === data.confirmPassword,
};

const validator = new SchemaValidator<User>({
    schema: [
        isRequired("username", 6001),
        isEmail(6002),
        minLength("password", 8, 6003),
        passwordsMatch,
    ],
});
```

## NotificationPattern

Estrutura padronizada de notificação de erro:

```typescript
interface NotificationPattern {
    code: number;
    success: boolean;
    name: string | number | symbol;
    error: string;
    description: string;
}
```

## ResultPattern<T>

Estrutura padronizada do resultado da validação:

```typescript
interface ResultPattern<T> {
    success: boolean;
    notification: NotificationPattern[];
    data: T;
}
```

## Rule<T>

Define uma regra de validação:

```typescript
interface Rule<T> {
    name: keyof T;
    code: number;
    error: string;
    description: string;
    runValidate(data: T): boolean | Promise<boolean>;
}
```

## Funcionalidades

- **Zero dependências** - Não requer bibliotecas externas
- **NotificationPattern** - Notificações padronizadas
- **ResultPattern** - Resposta padronizada
- **Suporte a sync e async** - Funciona com funções síncronas e assíncronas
- **Validação contínua** - Executa todas as regras e retorna todos os erros
- **Totalmente tipado** - TypeScript nativo