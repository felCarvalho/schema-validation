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