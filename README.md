# schemaValidation

Biblioteca de validação simples, leve e agnóstica com **NotificationPattern** e **ResultPattern** para respostas padronizadas.

---

## Sumário

- [Por que usar?](#por-que-usar)
- [Modelo Mental](#modelo-mental)
- [Quick Start](#quick-start)
- [Conceitos Fundamentais](#conceitos-fundamentais)
- [Guias Práticos](#guias-práticos)
  - [Validar objetos aninhados](#validar-objetos-aninhados)
  - [Validar com chamadas assíncronas](#validar-com-chamadas-assíncronas)
  - [Validar arrays](#validar-arrays)
  - [Criar regras reutilizáveis](#criar-regras-reutilizáveis)
  - [Transformar dados antes de validar](#transformar-dados-antes-de-validar)
  - [Validar condicionalmente](#validar-condicionalmente)
  - [Parar no primeiro erro](#parar-no-primeiro-erro)
  - [Combinar transform + condition + abortEarly](#combinar-transform--condition--abortearly)
  - [Criar padrões customizados](#criar-padrões-customizados)
  - [Integrar com APIs REST](#integrar-com-apis-rest)
- [API Reference](#api-reference)
- [Funcionalidades](#funcionalidades)
- [Licença](#licença)

---

## Por que usar?

Validar dados é uma das tarefas mais comuns em qualquer aplicação. A maioria das bibliotecas de validação ou é acoplada a um framework, ou força um schema declarativo com DSL própria, ou é pesada em dependências.

O **schemaValidation** adota uma abordagem diferente:

| Característica | schemaValidation | Outras libs |
|---|---|---|
| **Dependências** | Zero | Zod (~10), Joi (~15), class-validator (~5) |
| **Estilo** | Regras como funções puras | DSL declarativa / decorators |
| **Acoplamento** | Agnóstico (qualquer objeto) | Muitas vezes acoplado a framework |
| **Padrões** | Notification + Result + Command | Apenas validação |
| **Tamanho** | ~90 linhas de código | Milhares de linhas |

**Ideal para:**
- APIs REST que precisam de respostas estruturadas com lista de erros
- Validação de formulários, payloads, DTOs
- Projetos que valorizam zero dependências
- Quem prefere código imperativo/explícito a DSLs mágicas

**Talvez não seja ideal se:**
- Você precisa de type narrowing por schema (type inference da forma dos dados) — use Zod
- Você precisa de parsing + validação em cadeia — use Zod

---

## Modelo Mental

A biblioteca implementa três padrões de design que trabalham juntos:

```
┌─────────────────────────────────────────────────────────────┐
│                     SchemaValidator                         │
│                                                             │
│  execute(data) ──────────────────────────────────────────►  │
│                                                             │
│  Schema (Rule[])                                            │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                   │
│  │ Rule 1  │──►│ Rule 2  │──►│ Rule 3  │──► ...            │
│  │         │   │         │   │         │                    │
│  │ 1. transform (opcional)                                  │
│  │ 2. condition (opcional)                                  │
│  │ 3. runValidate                                           │
│  └────┬────┘   └────┬────┘   └────┬────┘                   │
│       │              │              │                        │
│       ▼              ▼              ▼                        │
│  ┌────────────────────────────────────┐                     │
│  │     NotificationPattern[]          │                     │
│  │  { key, error, description, ... }  │                     │
│  └───────────────┬────────────────────┘                     │
│                  ▼                                          │
│  ┌────────────────────────────────────┐                     │
│  │        ResultPattern<T>            │                     │
│  │  { success, notification[], data } │                     │
│  └────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Os três padrões

**Command Pattern** — `SchemaValidator` implementa `Command<T, R>`. Você instancia com um schema e chama `execute(data)`. O validator encapsula toda a lógica de execução.

**Notification Pattern** — Cada falha de validação gera uma `Notification` com `key` (campo), `error` (mensagem) e `description` (detalhe opcional). Todas as notificações são coletadas em um array.

**Result Pattern** — O resultado final é um objeto com `success` (booleano), `notification` (array de notificações) e `data` (dados originais/transformados).

### Ordem de execução dentro de cada Rule

```
para cada rule:
  1. transform(data)      → modifica os dados (encadeado entre regras)
  2. condition(data)      → se false, pula a regra
  3. runValidate(data)    → executa a validação
  4. se inválido → notificationMappers(rule, data) → adiciona ao array
```

---

## Quick Start

### Instalação

```bash
npm install @felipe-lib/schema-local
```

### Sua primeira validação

```typescript
import { SchemaValidator } from "@felipe-lib/schema-local";

interface User {
  name: string;
  email: string;
}

const validator = new SchemaValidator<User>({
  schema: [
    {
      key: "name",
      error: () => "Nome é obrigatório",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Email inválido",
      runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
  ],
});

const result = await validator.execute({
  name: "João",
  email: "joao@email.com",
});

console.log(result.success); // true
console.log(result.notification); // []
console.log(result.data); // { name: "João", email: "joao@email.com" }
```

**O que aconteceu aqui?**

1. Criamos uma interface `User` com os campos a validar.
2. Instanciamos `SchemaValidator<User>` passando um `schema` — array de regras.
3. Cada regra tem `key` (nome do campo), `error` (mensagem de erro) e `runValidate` (função que retorna `true` se válido).
4. Chamamos `execute(data)` e recebemos um `ResultPattern` com `success`, `notification` e `data`.
5. Como o nome e o email eram válidos, `success` é `true` e `notification` está vazio.

> **Nota:** Os mappers são opcionais — a biblioteca já fornece defaults que geram o `NotificationPattern` e `ResultPattern` padrão. Você só precisa customizá-los se quiser formatos diferentes (ex: resposta de API HTTP).

### Adicionando mais regras

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

const validator = new SchemaValidator<User>({
  schema: [
    {
      key: "name",
      error: () => "Nome é obrigatório",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Email inválido",
      runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
    {
      key: "age",
      error: () => "Idade deve ser maior que 0",
      description: () => "Verifica se a idade é positiva",
      runValidate: (data) => data.age > 0,
    },
  ],
});
```

### Lendo erros

```typescript
const result = await validator.execute({
  name: "",
  email: "invalido",
  age: -5,
});

if (!result.success) {
  for (const err of result.notification) {
    console.log(`${String(err.key)}: ${err.error}`);
  }
}
// name: Nome é obrigatório
// email: Email inválido
// age: Idade deve ser maior que 0
```

Por padrão, **todas as regras são executadas** e **todos os erros são coletados** — você recebe uma lista completa do que está errado, não apenas o primeiro erro.

---

## Conceitos Fundamentais

### Anatomia de uma Rule

```typescript
interface Rule<T> {
  key: keyof T;                                    // campo que está sendo validado
  error: (data: T) => string;                       // mensagem de erro (pode ser dinâmica)
  transform?: (data: T) => T | Promise<T>;          // transforma dados antes da validação
  condition?: (data: T) => boolean | Promise<boolean>; // se false, regra é ignorada
  runValidate(data: T): boolean | Promise<boolean>; // lógica da validação
  description?: (data: T) => string;                 // descrição opcional (pode ser dinâmica)
}
```

Todos os callbacks (`transform`, `condition`, `runValidate`, `error`) suportam tanto execução **síncrona** quanto **assíncrona** (retornando `Promise`).

### NotificationPattern

Estrutura padronizada de notificação de erro:

```typescript
interface NotificationPattern {
  success: boolean;              // sempre false para notificações de erro
  key: string | number | symbol; // campo que falhou
  error: string;                 // mensagem de erro
  description?: string;          // detalhamento opcional
}
```

### ResultPattern\<T\>

Estrutura padronizada do resultado:

```typescript
interface ResultPattern<T> {
  success: boolean;                  // true se nenhum erro
  notification: NotificationPattern[]; // array de erros encontrados
  data: T;                           // dados originais ou transformados
}
```

### Mappers Customizados

Os mappers traduzem a regra e os dados para os formatos de notificação e resultado. Use-os quando precisar de estruturas diferentes da padrão:

```typescript
// Mapper de notificação — transforma Rule + data em NotificationPattern
notificationMappers: (rule, data) => ({
  success: false,
  key: rule.key,
  error: rule.error(data),
  description: rule.description?.(data),
})

// Mapper de resultado — transforma data + notificações em ResultPattern
resultMappers: (data, notif) => ({
  success: notif.length === 0,
  notification: notif,
  data,
})
```

Se você **não fornecer mappers**, a biblioteca usa os defaults — que produzem exatamente as estruturas acima. Forneça mappers customizados apenas quando seu `NotificationPattern` ou `ResultPattern` tiverem campos extras.

### Command\<T, R\>

Interface que `SchemaValidator` implementa:

```typescript
interface Command<T extends object, R extends object> {
  execute(data: T): Promise<R>;
}
```

Isso permite tratar qualquer validador como um comando executável, facilitando integração com padrões como **Command Bus**, **Mediator** ou **Use Case**.

---

## Guias Práticos

### Validar objetos aninhados

Componha validators: crie um validador para o objeto interno e chame-o dentro da regra do objeto externo.

```typescript
interface Address {
  street: string;
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
      error: () => "Rua é obrigatória",
      runValidate: (data) => data.street.length > 0,
    },
    {
      key: "zipCode",
      error: () => "CEP inválido",
      runValidate: (data) => /^\d{5}-\d{3}$/.test(data.zipCode),
    },
  ],
});

const userValidator = new SchemaValidator<User>({
  schema: [
    {
      key: "name",
      error: () => "Nome é obrigatório",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "address",
      error: (data) => "Endereço inválido",
      runValidate: async (data) => {
        const result = await addressValidator.execute(data.address);
        return result.success;
      },
    },
  ],
});
```

### Validar com chamadas assíncronas

`runValidate` aceita funções assíncronas — ideal para verificar existência no banco, chamadas de API, etc.

```typescript
interface LoginData {
  email: string;
  password: string;
}

const loginValidator = new SchemaValidator<LoginData>({
  schema: [
    {
      key: "email",
      error: () => "Email é obrigatório",
      runValidate: (data) => !!data.email,
    },
    {
      key: "password",
      error: () => "Senha deve ter pelo menos 8 caracteres",
      runValidate: (data) => data.password.length >= 8,
    },
    {
      key: "email",
      error: () => "Usuário não encontrado",
      description: () => "Verifica se o email existe na base",
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

### Validar arrays

Use métodos como `every()`, `some()` ou `filter()` para validar cada item do array.

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
      error: () => "Pedido vazio",
      runValidate: (data) => data.items.length > 0,
    },
    {
      key: "items",
      error: () => "Produto sem nome",
      runValidate: (data) =>
        data.items.every((item) => item.name.trim().length > 0),
    },
    {
      key: "items",
      error: () => "Preço inválido",
      runValidate: (data) => data.items.every((item) => item.price > 0),
    },
  ],
});
```

### Criar regras reutilizáveis

Encapsule regras comuns em **factory functions** para evitar repetição.

```typescript
interface User {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const isRequired = (field: keyof User, error: string) => ({
  key: field,
  error: () => error,
  description: () => `Verifica se ${String(field)} foi fornecido`,
  runValidate: (data: User) => {
    const value = data[field];
    return typeof value === "string" ? value.trim().length > 0 : !!value;
  },
});

const isEmail = (error: string) => ({
  key: "email" as const,
  error: () => error,
  description: () => "Valida formato do email",
  runValidate: (data: User) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
});

const minLength = (field: keyof User, min: number, error: string) => ({
  key: field,
  error: () => error,
  description: () => `Mínimo de ${min} caracteres`,
  runValidate: (data: User) => {
    const value = data[field];
    return typeof value === "string" ? value.length >= min : false;
  },
});

const passwordsMatch = {
  key: "confirmPassword" as const,
  error: () => "Senhas não conferem",
  description: () => "Confirmação deve ser igual à senha",
  runValidate: (data: User) => data.password === data.confirmPassword,
};

const validator = new SchemaValidator<User>({
  schema: [
    isRequired("username", "Nome de usuário é obrigatório"),
    isEmail("Email inválido"),
    minLength("password", 8, "Senha deve ter pelo menos 8 caracteres"),
    passwordsMatch,
  ],
});
```

### Transformar dados antes de validar

O campo `transform` modifica os dados antes da validação. O resultado é **encadeado** entre regras — cada regra recebe os dados já transformados pelas anteriores.

```typescript
interface User {
  name: string;
  email: string;
}

const validator = new SchemaValidator<User>({
  schema: [
    {
      key: "name",
      error: () => "Nome é obrigatório",
      transform: (data) => ({ ...data, name: data.name.trim() }),
      runValidate: (data) => data.name.length > 0,
    },
    {
      key: "email",
      error: () => "Email inválido",
      transform: (data) => ({
        ...data,
        email: data.email.toLowerCase().trim(),
      }),
      runValidate: (data) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
  ],
});

const result = await validator.execute({
  name: "  João  ",
  email: "  JOAO@EMAIL.COM  ",
});

console.log(result.data.name); // "João"
console.log(result.data.email); // "joao@email.com"
```

**Transform assíncrono:**

```typescript
const validator = new SchemaValidator<User>({
  schema: [
    {
      key: "email",
      error: () => "Email já cadastrado",
      transform: async (data) => {
        const normalized = data.email.toLowerCase().trim();
        return { ...data, email: normalized };
      },
      runValidate: async (data) => {
        const response = await fetch(
          `/api/check-email?email=${data.email}`
        );
        const { exists } = await response.json();
        return !exists;
      },
    },
  ],
});
```

### Validar condicionalmente

O campo `condition` determina se a regra deve ser executada. Se a condição retornar `false`, a regra é ignorada.

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
      error: () => "Tipo inválido",
      runValidate: (data) => ["individual", "company"].includes(data.type),
    },
    {
      key: "cpf",
      error: () => "CPF inválido",
      condition: (data) => data.type === "individual",
      runValidate: (data) => /^\d{11}$/.test(data.cpf),
    },
    {
      key: "cnpj",
      error: () => "CNPJ inválido",
      condition: (data) => data.type === "company",
      runValidate: (data) => /^\d{14}$/.test(data.cnpj),
    },
    {
      key: "companyName",
      error: () => "Razão social obrigatória",
      condition: (data) => data.type === "company",
      runValidate: (data) => data.companyName.length > 0,
    },
  ],
});
```

**Condition assíncrona:**

```typescript
interface ProductForm {
  categoryId: string;
  discount: number;
}

const validator = new SchemaValidator<ProductForm>({
  schema: [
    {
      key: "discount",
      error: () => "Desconto inválido",
      condition: async (data) => {
        const response = await fetch(
          `/api/categories/${data.categoryId}`
        );
        const category = await response.json();
        return category.allowDiscount;
      },
      runValidate: (data) => data.discount >= 0 && data.discount <= 100,
    },
  ],
});
```

### Parar no primeiro erro

Com `abortEarly: true`, a validação é interrompida assim que o primeiro erro é encontrado.

```typescript
interface LoginData {
  email: string;
  password: string;
}

const loginValidator = new SchemaValidator<LoginData>({
  schema: [
    {
      key: "email",
      error: () => "Email é obrigatório",
      runValidate: (data) => data.email.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Email inválido",
      runValidate: (data) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
    {
      key: "password",
      error: () => "Senha é obrigatória",
      runValidate: (data) => data.password.length > 0,
    },
    {
      key: "password",
      error: () => "Mínimo de 8 caracteres",
      runValidate: (data) => data.password.length >= 8,
    },
  ],
  abortEarly: true,
});

const result = await loginValidator.execute({
  email: "",
  password: "123",
});

console.log(result.notification.length); // 1 — apenas o primeiro erro
```

### Combinar transform + condition + abortEarly

As funcionalidades podem ser combinadas livremente. A ordem de execução dentro de cada regra segue o pipeline: **transform → condition → runValidate**.

```typescript
interface OrderData {
  total: number;
  couponCode: string;
  finalTotal: number;
}

const orderValidator = new SchemaValidator<OrderData>({
  schema: [
    {
      key: "total",
      error: () => "Total deve ser positivo",
      runValidate: (data) => data.total > 0,
    },
    {
      key: "couponCode",
      error: () => "Cupom inválido",
      condition: (data) => data.couponCode.length > 0,
      transform: async (data) => {
        const response = await fetch(`/api/coupons/${data.couponCode}`);
        const coupon = await response.json();
        return {
          ...data,
          finalTotal: data.total * (1 - coupon.discount / 100),
        };
      },
      runValidate: async (data) => {
        const response = await fetch(`/api/coupons/${data.couponCode}`);
        return response.ok;
      },
    },
  ],
  abortEarly: true,
});

const result = await orderValidator.execute({
  total: 200,
  couponCode: "BLACK20",
  finalTotal: 0,
});

console.log(result.data.finalTotal); // 160 (200 - 20%)
```

### Criar padrões customizados

Quando os mappers padrão não bastam, você pode estender `NotificationPattern` e `ResultPattern` com campos específicos do seu domínio.

**Notification customizado com tipo de erro:**

```typescript
interface CustomNotification {
  success: boolean;
  key: string | number | symbol;
  error: string;
  field: string;
  message: string;
  type: "error" | "warning";
}

interface CustomResult<T> {
  success: boolean;
  notification: CustomNotification[];
  isValid: boolean;
  errors: CustomNotification[];
  data: T;
}

interface User {
  name: string;
  email: string;
}

const validator = new SchemaValidator<User, CustomNotification, CustomResult<User>>({
  schema: [
    {
      key: "email",
      error: () => "Email inválido",
      runValidate: (data) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
  ],
  notificationMappers: (rule, data) => ({
    success: false,
    key: rule.key,
    error: rule.error(data),
    field: String(rule.key),
    message: rule.error(data),
    type: "error" as const,
  }),
  resultMappers: (data, notif) => ({
    success: notif.length === 0,
    notification: notif,
    isValid: notif.length === 0,
    errors: notif,
    data,
  }),
});

const result = await validator.execute({
  name: "João",
  email: "invalido",
});

console.log(result.isValid); // false
console.log(result.errors[0].field); // "email"
console.log(result.errors[0].type); // "error"
```

### Integrar com APIs REST

Use mappers customizados para gerar respostas no formato que sua API espera.

```typescript
interface ApiResponse<T> {
  status: number;
  message: string;
  payload?: T;
  errors: { field: string; reason: string }[];
}

interface ApiNotification {
  success: boolean;
  key: string | number | symbol;
  error: string;
  field: string;
  message: string;
}

interface User {
  name: string;
  email: string;
}

const apiValidator = new SchemaValidator<User, ApiNotification, ApiResponse<User>>({
  schema: [
    {
      key: "name",
      error: () => "Nome é obrigatório",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Email inválido",
      runValidate: (data) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
  ],
  notificationMappers: (rule, data) => ({
    success: false,
    key: rule.key,
    error: rule.error(data),
    field: String(rule.key),
    message: rule.error(data),
  }),
  resultMappers: (data, notif) => ({
    success: notif.length === 0,
    notification: notif as NotificationPattern[],
    data,
    status: notif.length === 0 ? 200 : 400,
    message: notif.length === 0 ? "OK" : "Erro de validação",
    payload: notif.length === 0 ? data : undefined,
    errors: notif.map((n) => ({
      field: n.field,
      reason: n.message,
    })),
  }),
});

const result = await apiValidator.execute({
  name: "João",
  email: "joao@email.com",
});

// result.status === 200
// result.errors === []
// Uso em um controller Express/Fastify:
// res.status(result.status).json(result);
```

---

## API Reference

### `SchemaValidator<T, N, R>`

Classe principal. Implementa `Command<T, R>`.

| Parâmetro genérico | Default | Descrição |
|---|---|---|
| `T extends object` | — | Tipo do objeto a ser validado |
| `N extends NotificationPattern` | `NotificationPattern` | Tipo da notificação de erro |
| `R extends ResultPattern<T>` | `ResultPattern<T>` | Tipo do resultado |

**Construtor:**

```typescript
new SchemaValidator<T, N, R>({
  schema: Rule<T>[];
  notificationMappers?: (rule: Rule<T>, data: T) => N;
  resultMappers?: (data: T, notif: N[]) => R;
  abortEarly?: boolean;
})
```

| Opção | Obrigatório | Padrão | Descrição |
|---|---|---|---|
| `schema` | Sim | — | Array de regras de validação |
| `notificationMappers` | Não | mapper padrão | Customiza como notificações são geradas |
| `resultMappers` | Não | mapper padrão | Customiza como o resultado é montado |
| `abortEarly` | Não | `false` | Se `true`, para no primeiro erro |

**Métodos:**

| Método | Retorno | Descrição |
|---|---|---|
| `execute(data: T)` | `Promise<R>` | Executa todas as regras e retorna o resultado |
| `validation(data: T)` | `Promise<R>` | Alias interno — mesmo comportamento de `execute` |

### Tipos exportados

```typescript
import type {
  NotificationPattern,
  ResultPattern,
  Rule,
  Command,
} from "@felipe-lib/schema-local/types";
```

#### `Rule<T>`

```typescript
interface Rule<T> {
  key: keyof T;
  error: (data: T) => string;
  transform?: (data: T) => T | Promise<T>;
  condition?: (data: T) => boolean | Promise<boolean>;
  runValidate(data: T): boolean | Promise<boolean>;
  description?: (data: T) => string;
}
```

#### `NotificationPattern`

```typescript
interface NotificationPattern {
  success: boolean;
  key: string | number | symbol;
  error: string;
  description?: string;
}
```

#### `ResultPattern<T>`

```typescript
interface ResultPattern<T> {
  success: boolean;
  notification: NotificationPattern[];
  data: T;
}
```

#### `Command<T, R>`

```typescript
interface Command<T extends object, R extends object> {
  execute(data: T): Promise<R>;
}
```

---

## Funcionalidades

- **Zero dependências** — não requer bibliotecas externas
- **NotificationPattern** — notificações de erro padronizadas
- **ResultPattern** — resultado padronizado com `success`, `notification[]` e `data`
- **Mappers customizáveis** — personalize os formatos de notificação e resultado
- **Suporte sync/async** — todos os callbacks aceitam funções síncronas e assíncronas
- **`transform`** — modifique os dados antes da validação (encadeado entre regras)
- **`condition`** — execute regras apenas quando uma condição for atendida
- **`abortEarly`** — interrompa no primeiro erro
- **Validação contínua** — execute todas as regras e colete todos os erros (padrão)
- **Totalmente tipado** — TypeScript nativo com genéricos
- **Command Pattern** — interface `Command<T, R>` para integração com Command Bus / Mediator
- **Agnóstico** — funciona com qualquer formato de objeto

---

## Licença

MIT © Felca
