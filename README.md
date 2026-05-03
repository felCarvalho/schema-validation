# SdkSchemaValidation

Biblioteca para validação de esquemas TypeScript com zero dependências.

## Instalação

```bash
npm install SdkSchemaValidation
```

## Uso Básico

```typescript
import { SchemaValidator } from "schemaValidation";

interface User {
    name: string;
    email: string;
    age: number;
}

const validator = new SchemaValidator<User, User>({
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

## Interfaces

### Rule<T>

Define uma regra de validação:

```typescript
interface Rule<T> {
    name: keyof T; // Campo que está sendo validado
    code: number; // Código de erro único
    error: string; // Mensagem de erro
    description: string; // Descrição da regra
    runValidate(data: T): boolean | Promise<boolean>; // Função de validação
}
```

### ResultPattern<T>

Retorno da validação:

```typescript
interface ResultPattern<T> {
    success: boolean; // true se todas as regras passaram
    notification: NotificationPattern[]; // Lista de erros
    data: T; // Dados processados
}
```

### NotificationPattern

Notificação de erro:

```typescript
interface NotificationPattern {
    code: number;
    success: boolean;
    name: string | number | symbol;
    error: string;
    description: string;
}
```

### Command<inputT, outputT>

Interface que o validador implementa:

```typescript
interface Command<inputT extends object, outputT> {
    execute(data: inputT): Promise<ResultPattern<outputT>>;
}
```

## Funcionalidades

- **Zero dependências** - Não requer bibliotecas externas
- **Suporte a async** - Funciona com funções síncronas e assíncronas
- **Tipagem completa** - Total suporte a TypeScript
- **Validação em lote** - Executa todas as regras e retorna todos os erros

## API

### SchemaValidator<input, output>

**Construtor:**

```typescript
new SchemaValidator<input, output>({ schema: Rule < input > [] });
```

**Métodos:**

- `execute(data: input): Promise<ResultPattern<output>>` - Executa a validação
- `validation(data: input): Promise<ResultPattern<output>>` - Alias para execute
