# schemaValidation

Biblioteca de validação simples, leve e agnóstica com NotificationPattern e ResultPattern para respostas padronizadas.

## Instalação

```bash
npm install @felipe-lib/schema-local
```

## Uso Básico

```typescript
import { SchemaValidator } from "@felipe-lib/schema-local";

interface User {
    name: string;
    email: string;
    age: number;
}

const validator = new SchemaValidator<User>({
    schema: [
        {
            key: "name",
            error: "Nome é obrigatório",
            description: "Verifica se o nome foi fornecido",
            runValidate: (data: User) => data.name.trim().length > 0,
        },
        {
            key: "email",
            error: "Email inválido",
            description: "Valida formato do email",
            runValidate: (data: User) =>
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
        description: rule.description,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
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
            key: "street",
            error: "Rua é obrigatória",
            runValidate: (data) => data.street.length > 0,
        },
        {
            key: "zipCode",
            error: "CEP inválido",
            runValidate: (data) => /^\d{5}-\d{3}$/.test(data.zipCode),
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
});

const userValidator = new SchemaValidator<User>({
    schema: [
        {
            key: "name",
            error: "Nome é obrigatório",
            runValidate: (data) => data.name.trim().length > 0,
        },
        {
            key: "address",
            error: "Endereço inválido",
            runValidate: async (data) => {
                const result = await addressValidator.execute(data.address);
                return result.success;
            },
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
});
```

### Validação assíncrona

```typescript
interface LoginData {
    email: string;
    password: string;
}

const loginValidator = new SchemaValidator<LoginData>({
    schema: [
        {
            key: "email",
            error: "Email é obrigatório",
            runValidate: (data) => !!data.email,
        },
        {
            key: "password",
            error: "Senha deve ter pelo menos 8 caracteres",
            runValidate: (data) => data.password.length >= 8,
        },
        {
            key: "email",
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
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
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
            key: "type",
            error: "Tipo inválido",
            runValidate: (data) =>
                ["individual", "company"].includes(data.type),
        },
        {
            key: "cpf",
            error: "CPF inválido",
            runValidate: (data) => {
                if (data.type === "individual") {
                    return /^\d{11}$/.test(data.cpf);
                }
                return true;
            },
        },
        {
            key: "cnpj",
            error: "CNPJ inválido",
            runValidate: (data) => {
                if (data.type === "company") {
                    return /^\d{14}$/.test(data.cnpj);
                }
                return true;
            },
        },
        {
            key: "companyName",
            error: "Razão social obrigatória",
            runValidate: (data) => {
                if (data.type === "company") {
                    return data.companyName.length > 0;
                }
                return true;
            },
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
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
            key: "items",
            error: "Pedido vazio",
            runValidate: (data) => data.items.length > 0,
        },
        {
            key: "items",
            error: "Produto sem nome",
            runValidate: (data) =>
                data.items.every((item) => item.name.trim().length > 0),
        },
        {
            key: "items",
            error: "Preço inválido",
            runValidate: (data) =>
                data.items.every((item) => item.price > 0),
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
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

const isRequired = (field: keyof User, error: string) => ({
    key: field,
    error,
    description: `Verifica se ${String(field)} foi fornecido`,
    runValidate: (data: User) => {
        const value = data[field];
        return typeof value === "string" ? value.trim().length > 0 : !!value;
    },
});

const isEmail = (error: string) => ({
    key: "email" as const,
    error,
    description: "Valida formato do email",
    runValidate: (data: User) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
});

const minLength = (field: keyof User, min: number, error: string) => ({
    key: field,
    error,
    description: `Verifica mínimo de ${min} caracteres`,
    runValidate: (data: User) => {
        const value = data[field];
        return typeof value === "string" ? value.length >= min : false;
    },
});

const passwordsMatch = {
    key: "confirmPassword" as const,
    error: "Senhas não conferem",
    description: "Confirmação de senha deve ser igual à senha",
    runValidate: (data: User) => data.password === data.confirmPassword,
};

const validator = new SchemaValidator<User>({
    schema: [
        isRequired("username", "Nome de usuário é obrigatório"),
        isEmail("Email inválido"),
        minLength("password", 8, "Senha deve ter pelo menos 8 caracteres"),
        passwordsMatch,
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
});
```

### Combinação de validações

```typescript
interface RegistrationForm {
    name: string;
    email: string;
    phone: string;
    password: string;
    birthDate: string;
}

const registrationValidator = new SchemaValidator<RegistrationForm>({
    schema: [
        {
            key: "name",
            error: "Nome completo é obrigatório",
            runValidate: (data) => data.name.split(" ").length >= 2,
        },
        {
            key: "email",
            error: "Email inválido",
            runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
        {
            key: "phone",
            error: "Telefone inválido",
            runValidate: (data) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.phone),
        },
        {
            key: "password",
            error: "Senha deve ter letras e números",
            runValidate: (data) =>
                /[a-zA-Z]/.test(data.password) && /[0-9]/.test(data.password),
        },
        {
            key: "birthDate",
            error: "Data de nascimento inválida",
            runValidate: (data) => {
                const date = new Date(data.birthDate);
                const now = new Date();
                return date < now && date.getFullYear() > 1900;
            },
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
});
```

### Custom Notification Pattern

```typescript
interface CustomNotification {
    field: string;
    message: string;
    type: "error" | "warning";
}

interface CustomResult<T> {
    isValid: boolean;
    errors: CustomNotification[];
    data: T;
}

const validator = new SchemaValidator<User, CustomNotification, CustomResult<User>>({
    schema: [
        {
            key: "email",
            error: "Email inválido",
            description: "Valida formato do email",
            runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
    ],
    notificationMappers: (rule) => ({
        field: String(rule.key),
        message: rule.error,
        type: "error" as const,
    }),
    resultMappers: (data, notif) => ({
        isValid: notif.length === 0,
        errors: notif,
        data,
    }),
});

const result = await validator.execute({
    name: "João",
    email: "invalid-email",
    password: "12345678",
    confirmPassword: "12345678",
});

console.log(result.isValid); // false
console.log(result.errors[0].field); // "email"
console.log(result.errors[0].type); // "error"
```

### Custom Result Pattern

```typescript
interface ApiResponse<T> {
    status: number;
    message: string;
    payload?: T;
    errors: { field: string; reason: string }[];
}

const apiValidator = new SchemaValidator<User, CustomNotification, ApiResponse<User>>({
    schema: [
        {
            key: "email",
            error: "Email inválido",
            description: "Valida formato do email",
            runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
        {
            key: "password",
            error: "Senha muito curta",
            description: "Senha deve ter pelo menos 8 caracteres",
            runValidate: (data) => data.password.length >= 8,
        },
    ],
    notificationMappers: (rule) => ({
        field: String(rule.key),
        message: rule.error,
        type: "error" as const,
    }),
    resultMappers: (data, notif) => ({
        status: notif.length === 0 ? 200 : 400,
        message: notif.length === 0 ? "Success" : "Validation failed",
        payload: notif.length === 0 ? data : undefined,
        errors: notif.map((n) => ({ field: n.field, reason: n.message })),
    }),
});

const result = await apiValidator.execute({
    name: "João",
    email: "joao@example.com",
    password: "123",
    confirmPassword: "123",
});

console.log(result.status); // 400
console.log(result.errors); // [{ field: "password", reason: "Senha muito curta" }]
```

### Validação com mensagens customizadas por campo

```typescript
interface FormInput {
    field: string;
    value: string;
}

const fieldMessages: Record<string, string> = {
    username: "Nome de usuário inválido",
    email: "Endereço de email inválido",
    password: "Senha não atende aos requisitos",
};

const validator = new SchemaValidator<FormInput>({
    schema: [
        {
            key: "field",
            error: fieldMessages["username"],
            description: "Valida username",
            runValidate: (data) => /^[a-zA-Z0-9_]{3,20}$/.test(data.value),
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
});

const result = await validator.execute({
    field: "username",
    value: "ab",
});
```

### Validação de intervalo numérico

```typescript
interface AgeConfig {
    minAge: number;
    maxAge: number;
    userAge: number;
}

const ageValidator = new SchemaValidator<AgeConfig>({
    schema: [
        {
            key: "userAge",
            error: `Idade deve estar entre minAge e maxAge`,
            description: "Valida idade dentro do intervalo",
            runValidate: (data) =>
                data.userAge >= data.minAge && data.userAge <= data.maxAge,
        },
    ],
    notificationMappers: (rule) => ({
        success: false,
        key: rule.key,
        error: rule.error,
    }),
    resultMappers: (data, notif) => ({
        success: notif.length === 0,
        notification: notif,
        data,
    }),
});
```

## NotificationPattern

Estrutura padronizada de notificação de erro:

```typescript
interface NotificationPattern {
    success: boolean;
    key: string | number | symbol;
    error: string;
    description?: string;
}
```

## ResultPattern\<T\>

Estrutura padronizada do resultado da validação:

```typescript
interface ResultPattern<T> {
    success: boolean;
    notification: NotificationPattern[];
    data: T;
}
```

## Rule\<T\>

Define uma regra de validação:

```typescript
interface Rule<T> {
    key: keyof T;
    error: string;
    runValidate(data: T): boolean | Promise<boolean>;
    description?: string;
    dependsOn?: string | string[];
}
```

## Command\<T, R\>

Interface que representa um comando executável:

```typescript
interface Command<T extends object, R extends object> {
    execute(data: T): Promise<R>;
}
```

## Funcionalidades

- **Zero dependências** - Não requer bibliotecas externas
- **NotificationPattern** - Notificações padronizadas
- **ResultPattern** - Resposta padronizada
- **Custom Mappers** - Personalize os padrões de notificação e resultado
- **Suporte a sync e async** - Funciona com funções síncronas e assíncronas
- **Validação contínua** - Executa todas as regras e retorna todos os erros
- **Totalmente tipado** - TypeScript nativo
- **dependsOn** - Dependência entre regras para controle de ordem de validação
