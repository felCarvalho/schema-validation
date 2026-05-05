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
            statusText: 1001,
            error: "Nome é obrigatório",
            description: "Verifica se o nome foi fornecido",
            runValidate: (data: User) => data.name.trim().length > 0,
        },
        {
            name: "email",
            statusText: 1002,
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
            statusText: 2001,
            error: "Rua é obrigatória",
            runValidate: (data) => data.street.length > 0,
        },
        {
            name: "zipCode",
            statusText: 2002,
            error: "CEP inválido",
            runValidate: (data) => /^\d{5}-\d{3}$/.test(data.zipCode),
        },
    ],
});

const userValidator = new SchemaValidator<User>({
    schema: [
        {
            name: "name",
            statusText: 1001,
            error: "Nome é obrigatório",
            runValidate: (data) => data.name.trim().length > 0,
        },
        {
            name: "address",
            statusText: 1002,
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
            statusText: 3001,
            error: "Email é obrigatório",
            runValidate: (data) => !!data.email,
        },
        {
            name: "password",
            statusText: 3002,
            error: "Senha deve ter pelo menos 8 caracteres",
            runValidate: (data) => data.password.length >= 8,
        },
        {
            name: "verify",
            statusText: 3003,
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
            statusText: 4001,
            error: "Tipo inválido",
            runValidate: (data) =>
                ["individual", "company"].includes(data.type),
        },
        {
            name: "cpf",
            statusText: 4002,
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
            statusText: 4003,
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
            statusText: 4004,
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
            statusText: 5001,
            error: "Pedido vazio",
            runValidate: (data) => data.items.length > 0,
        },
        {
            name: "items",
            statusText: 5002,
            error: "Produto sem nome",
            runValidate: (data) =>
                data.items.every((item) => item.name.trim().length > 0),
        },
        {
            name: "items",
            statusText: 5003,
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

const isRequired = (field: keyof User, statusText: number) => ({
    name: field,
    code,
    error: `${String(field)} é obrigatório`,
    description: `Verifica se ${String(field)} foi fornecido`,
    runValidate: (data: User) => {
        const value = data[field];
        return typeof value === "string" ? value.trim().length > 0 : !!value;
    },
});

const isEmail = (statusText: number) => ({
    name: "email",
    code,
    error: "Email inválido",
    description: "Valida formato do email",
    runValidate: (data: User) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
});

const minLength = (field: keyof User, min: number, statusText: number) => ({
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
    statusText: 6004,
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

### Custom Notification Pattern

```typescript
interface CustomNotification {
    field: string;
    message: string;
    statusText: number;
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
            name: "email",
            statusText: 7001,
            error: "Email inválido",
            description: "Valida formato do email",
            runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
    ],
    notificationMappers: (rule) => ({
        field: String(rule.name),
        message: rule.error,
        statusText: rule.code,
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
            name: "email",
            statusText: 7001,
            error: "Email inválido",
            description: "Valida formato do email",
            runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
        {
            name: "password",
            statusText: 7002,
            error: "Senha muito curta",
            description: "Senha deve ter pelo menos 8 caracteres",
            runValidate: (data) => data.password.length >= 8,
        },
    ],
    notificationMappers: (rule) => ({
        field: String(rule.name),
        message: rule.error,
        statusText: rule.code,
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
            name: "username",
            statusText: 8001,
            error: fieldMessages["username"],
            description: "Valida username",
            runValidate: (data) => /^[a-zA-Z0-9_]{3,20}$/.test(data.value),
        },
    ],
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
            name: "range",
            statusText: 9001,
            error: `Idade deve estar entre {min} e {max}`,
            description: "Valida idade dentro do intervalo",
            runValidate: (data) =>
                data.userAge >= data.minAge && data.userAge <= data.maxAge,
        },
    ],
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
            name: "name",
            statusText: 10001,
            error: "Nome completo é obrigatório",
            runValidate: (data) => data.name.split(" ").length >= 2,
        },
        {
            name: "email",
            statusText: 10002,
            error: "Email inválido",
            runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
        },
        {
            name: "phone",
            statusText: 10003,
            error: "Telefone inválido",
            runValidate: (data) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.phone),
        },
        {
            name: "password",
            statusText: 10004,
            error: "Senha deve ter letras e números",
            runValidate: (data) =>
                /[a-zA-Z]/.test(data.password) && /[0-9]/.test(data.password),
        },
        {
            name: "birthDate",
            statusText: 10005,
            error: "Data de nascimento inválida",
            runValidate: (data) => {
                const date = new Date(data.birthDate);
                const now = new Date();
                return date < now && date.getFullYear() > 1900;
            },
        },
    ],
});
```

## NotificationPattern

Estrutura padronizada de notificação de erro:

```typescript
interface NotificationPattern {
    statusText: CodigoStatus;
    success: boolean;
    name: string | number | symbol;
    error: string;
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
    statusText: CodigoStatus;
    error: string;
    description?: string;
    runValidate(data: T): boolean | Promise<boolean>;
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

## CodigoStatus

Código de status HTTP em português brasileiro para padronizar respostas de API:

```typescript
import { CodigoStatus, DescricaoStatus } from "@felca/schema-validation";

// Sugestão IntelliSense ao digitar
const status = CodigoStatus.SUCESSO;
const descricao = DescricaoStatus[CodigoStatus.SUCESSO];

// Exemplo em resposta de API
const response = {
    status: CodigoStatus.SUCESSO,
    message: DescricaoStatus[CodigoStatus.SUCESSO],
    data: { /* ... */ },
};
```

### Códigos disponíveis

| Códigos de sucesso (2xx) | Descrição |
|-------------------------|-----------|
| SUCESSO | Requisição processada com sucesso |
| CRIADO | Novo recurso criado |
| ACEITO | Requisição aceito para processamento |
| SEM_CONTEUDO | Requisição processada sem retorno |
| CONTEUDO_PARCIAL | Retorno parcial do recurso |

| Códigos de erro (4xx) | Descrição |
|----------------------|----------|
| REQUISICAO_INVALIDA | Sintaxe inválida |
| NAO_AUTENTICADO | Autenticação necessária |
| ACESSO_NEGADO | Permissão negada |
| RECURSO_NAO_ENCONTRADO | Recurso não encontrado |
| METODO_NAO_PERMITIDO | Método HTTP não permitido |

| Códigos de erro servidor (5xx) | Descrição |
|------------------------------|----------|
| ERRO_INTERNO_SERVIDOR | Erro inesperado no servidor |
| NAO_IMPLEMENTADO | Funcionalidade não implementada |
| SERVICO_INDISPONIVEL | Serviço temporariamente indisponível |