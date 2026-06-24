# schemaValidation

A simple, lightweight, and agnostic validation library with **NotificationPattern** and **ResultPattern** for standardized responses.

---

## Table of Contents

- [Why?](#why)
- [Mental Model](#mental-model)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [How-to Guides](#how-to-guides)
  - [Validate nested objects](#validate-nested-objects)
  - [Validate with async calls](#validate-with-async-calls)
  - [Validate arrays](#validate-arrays)
  - [Create reusable rules](#create-reusable-rules)
  - [Transform data before validation](#transform-data-before-validation)
  - [Validate conditionally](#validate-conditionally)
  - [Stop on first error](#stop-on-first-error)
  - [Combine transform + condition + abortEarly](#combine-transform--condition--abortearly)
  - [Create custom patterns](#create-custom-patterns)
  - [Integrate with REST APIs](#integrate-with-rest-apis)
  - [Pass context to rules](#pass-context-to-rules)
  - [Filter rules by groups, pick, and omit](#filter-rules-by-groups-pick-and-omit)
- [API Reference](#api-reference)
- [Features](#features)
- [License](#license)

---

## Why?

Data validation is one of the most common tasks in any application. Most validation libraries are either framework-coupled, force a declarative schema DSL, or are heavy on dependencies.

**schemaValidation** takes a different approach:

| Trait | schemaValidation | Other libs |
|---|---|---|
| **Dependencies** | Zero | Zod (~10), Joi (~15), class-validator (~5) |
| **Style** | Rules as pure functions | Declarative DSL / decorators |
| **Coupling** | Agnostic (any object) | Often framework-bound |
| **Patterns** | Notification + Result + Command | Validation only |
| **Size** | ~90 lines of code | Thousands of lines |

**Ideal for:**
- REST APIs that need structured error responses with error lists
- Form validation, payloads, DTOs
- Projects that value zero dependencies
- Those who prefer explicit/imperative code over magical DSLs

**Probably not ideal if:**
- You need type narrowing via schema (inference of data shape) — use Zod
- You need parsing + validation chaining — use Zod

---

## Mental Model

The library implements three design patterns working together:

```
┌─────────────────────────────────────────────────────────────┐
│                     SchemaValidator                         │
│                                                             │
│  execute(data, context, options?) ───────────────────────►  │
│                                                             │
│  Schema (Rule[])                                            │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                   │
│  │ Rule 1  │──►│ Rule 2  │──►│ Rule 3  │──► ...            │
│  │         │   │         │   │         │                    │
│  │ 1. transform (optional)                                  │
│  │ 2. condition (optional)                                  │
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

### The three patterns

**Command Pattern** — `SchemaValidator` implements `Command<T, R, C>`. You instantiate with a schema and call `execute(data, context, options?)`. The third parameter accepts `{ groups?, pick?, omit? }` to filter which rules will run. The validator encapsulates all execution logic.

**Notification Pattern** — Each validation failure generates a `Notification` with `key` (field), `error` (message), and `description` (optional detail). All notifications are collected into an array.

**Result Pattern** — The final result is an object with `success` (boolean), `notification` (array of notifications), and `data` (original/transformed data).

### Execution order within each Rule

```
for each rule:
  1. transform(data, context)      → modifies data (chained across rules)
  2. condition(data, context)      → if false, skip the rule
  3. runValidate(data, context)    → runs validation
  4. if invalid → notificationMappers(rule, data, context) → push to array
```

---

## Quick Start

### Installation

```bash
npm install @felipe-lib/schema-local
```

### Your first validation

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
      error: () => "Name is required",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Invalid email",
      runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
  ],
});

const result = await validator.execute({
  name: "John",
  email: "john@email.com",
});

console.log(result.success); // true
console.log(result.notification); // []
console.log(result.data); // { name: "John", email: "john@email.com" }
```

**What happened here?**

1. We created a `User` interface with the fields to validate.
2. We instantiated `SchemaValidator<User>` passing a `schema` — an array of rules.
3. Each rule has `key` (field name), `error` (error message), and `runValidate` (function returning `true` if valid).
4. We called `execute(data)` and received a `ResultPattern` with `success`, `notification`, and `data`.
5. Since both name and email were valid, `success` is `true` and `notification` is empty.

> **Note:** Mappers are optional — the library already provides defaults that generate the standard `NotificationPattern` and `ResultPattern`. You only need to customize them if you want different formats (e.g., HTTP API responses).

### Adding more rules

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
      error: () => "Name is required",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Invalid email",
      runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
    {
      key: "age",
      error: () => "Age must be greater than 0",
      description: () => "Checks if age is positive",
      runValidate: (data) => data.age > 0,
    },
  ],
});
```

### Reading errors

```typescript
const result = await validator.execute({
  name: "",
  email: "invalid",
  age: -5,
});

if (!result.success) {
  for (const err of result.notification) {
    console.log(`${String(err.key)}: ${err.error}`);
  }
}
// name: Name is required
// email: Invalid email
// age: Age must be greater than 0
```

By default, **all rules are executed** and **all errors are collected** — you get a full list of what's wrong, not just the first error.

---

## Core Concepts

### Rule anatomy

```typescript
interface Rule<T, C> {
  key: keyof T;                                               // field being validated
  error: (data: T, context: C) => string;                     // error message (can be dynamic)
  groups?: string[];                                          // groups for filtering execution (see "Filter rules by groups")
  transform?: (data: T, context: C) => T | Promise<T>;        // transforms data before validation
  condition?: (data: T, context: C) => boolean | Promise<boolean>; // if false, rule is skipped
  runValidate(data: T, context: C): boolean | Promise<boolean>; // validation logic
  description?: (data: T, context: C) => string;              // optional description (can be dynamic)
}
```

All callbacks (`transform`, `condition`, `runValidate`, `error`, `description`) support both **synchronous** and **asynchronous** execution (returning `Promise`). All receive `(data, context)` — allowing you to pass external dependencies like database connections, request objects, etc.

### NotificationPattern

Standardized error notification structure:

```typescript
interface NotificationPattern {
  success: boolean;              // always false for error notifications
  key: string | number | symbol; // field that failed
  error: string;                 // error message
  description?: string;          // optional detail
}
```

### ResultPattern\<T\>

Standardized result structure:

```typescript
interface ResultPattern<T> {
  success: boolean;                  // true if no errors
  notification: NotificationPattern[]; // array of found errors
  data: T;                           // original or transformed data
}
```

### Custom mappers

Mappers translate the rule and data into the notification and result formats. Use them when you need structures different from the defaults:

```typescript
// Notification mapper — transforms Rule + data + context into NotificationPattern
notificationMappers: (rule, data, context) => ({
  success: false,
  key: rule.key,
  error: rule.error(data, context),
  description: rule.description?.(data, context),
})

// Result mapper — transforms data + notifications into ResultPattern
resultMappers: (data, notif) => ({
  success: notif.length === 0,
  notification: notif,
  data,
})
```

If you **don't provide mappers**, the library uses defaults — which produce exactly the structures above. Provide custom mappers only when your `NotificationPattern` or `ResultPattern` has extra fields.

### Command\<T, R, C\>

Interface that `SchemaValidator` implements:

```typescript
interface Command<T extends object, R extends object, C extends object> {
  execute(data: T, context: C): Promise<R>;
}
```

This allows treating any validator as an executable command, facilitating integration with patterns like **Command Bus**, **Mediator**, or **Use Case**.

---

## How-to Guides

### Validate nested objects

Compose validators: create a validator for the inner object and call it within the outer object's rule.

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
      error: () => "Street is required",
      runValidate: (data) => data.street.length > 0,
    },
    {
      key: "zipCode",
      error: () => "Invalid ZIP code",
      runValidate: (data) => /^\d{5}-\d{3}$/.test(data.zipCode),
    },
  ],
});

const userValidator = new SchemaValidator<User>({
  schema: [
    {
      key: "name",
      error: () => "Name is required",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "address",
      error: () => "Invalid address",
      runValidate: async (data) => {
        const result = await addressValidator.execute(data.address);
        return result.success;
      },
    },
  ],
});
```

### Validate with async calls

`runValidate` accepts async functions — ideal for checking existence in the database, API calls, etc.

```typescript
interface LoginData {
  email: string;
  password: string;
}

const loginValidator = new SchemaValidator<LoginData>({
  schema: [
    {
      key: "email",
      error: () => "Email is required",
      runValidate: (data) => !!data.email,
    },
    {
      key: "password",
      error: () => "Password must be at least 8 characters",
      runValidate: (data) => data.password.length >= 8,
    },
    {
      key: "email",
      error: () => "User not found",
      description: () => "Checks if the email exists in the database",
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

### Validate arrays

Use methods like `every()`, `some()`, or `filter()` to validate each array item.

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
      error: () => "Order is empty",
      runValidate: (data) => data.items.length > 0,
    },
    {
      key: "items",
      error: () => "Product has no name",
      runValidate: (data) =>
        data.items.every((item) => item.name.trim().length > 0),
    },
    {
      key: "items",
      error: () => "Invalid price",
      runValidate: (data) => data.items.every((item) => item.price > 0),
    },
  ],
});
```

### Create reusable rules

Encapsulate common rules in **factory functions** to avoid repetition.

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
  description: () => `Checks if ${String(field)} was provided`,
  runValidate: (data: User) => {
    const value = data[field];
    return typeof value === "string" ? value.trim().length > 0 : !!value;
  },
});

const isEmail = (error: string) => ({
  key: "email" as const,
  error: () => error,
  description: () => "Validates email format",
  runValidate: (data: User) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
});

const minLength = (field: keyof User, min: number, error: string) => ({
  key: field,
  error: () => error,
  description: () => `Minimum of ${min} characters`,
  runValidate: (data: User) => {
    const value = data[field];
    return typeof value === "string" ? value.length >= min : false;
  },
});

const passwordsMatch = {
  key: "confirmPassword" as const,
  error: () => "Passwords do not match",
  description: () => "Confirmation must match the password",
  runValidate: (data: User) => data.password === data.confirmPassword,
};

const validator = new SchemaValidator<User>({
  schema: [
    isRequired("username", "Username is required"),
    isEmail("Invalid email"),
    minLength("password", 8, "Password must be at least 8 characters"),
    passwordsMatch,
  ],
});
```

### Transform data before validation

The `transform` field modifies data before validation. The result is **chained** across rules — each rule receives the data already transformed by previous rules.

```typescript
interface User {
  name: string;
  email: string;
}

const validator = new SchemaValidator<User>({
  schema: [
    {
      key: "name",
      error: () => "Name is required",
      transform: (data) => ({ ...data, name: data.name.trim() }),
      runValidate: (data) => data.name.length > 0,
    },
    {
      key: "email",
      error: () => "Invalid email",
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
  name: "  John  ",
  email: "  JOHN@EMAIL.COM  ",
});

console.log(result.data.name); // "John"
console.log(result.data.email); // "john@email.com"
```

**Async transform:**

```typescript
const validator = new SchemaValidator<User>({
  schema: [
    {
      key: "email",
      error: () => "Email already registered",
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

### Validate conditionally

The `condition` field determines whether a rule should execute. If the condition returns `false`, the rule is skipped.

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
      error: () => "Invalid type",
      runValidate: (data) => ["individual", "company"].includes(data.type),
    },
    {
      key: "cpf",
      error: () => "Invalid CPF",
      condition: (data) => data.type === "individual",
      runValidate: (data) => /^\d{11}$/.test(data.cpf),
    },
    {
      key: "cnpj",
      error: () => "Invalid CNPJ",
      condition: (data) => data.type === "company",
      runValidate: (data) => /^\d{14}$/.test(data.cnpj),
    },
    {
      key: "companyName",
      error: () => "Company name is required",
      condition: (data) => data.type === "company",
      runValidate: (data) => data.companyName.length > 0,
    },
  ],
});
```

**Async condition:**

```typescript
interface ProductForm {
  categoryId: string;
  discount: number;
}

const validator = new SchemaValidator<ProductForm>({
  schema: [
    {
      key: "discount",
      error: () => "Invalid discount",
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

### Stop on first error

With `abortEarly: true`, validation stops as soon as the first error is found.

```typescript
interface LoginData {
  email: string;
  password: string;
}

const loginValidator = new SchemaValidator<LoginData>({
  schema: [
    {
      key: "email",
      error: () => "Email is required",
      runValidate: (data) => data.email.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Invalid email",
      runValidate: (data) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
    {
      key: "password",
      error: () => "Password is required",
      runValidate: (data) => data.password.length > 0,
    },
    {
      key: "password",
      error: () => "Minimum 8 characters",
      runValidate: (data) => data.password.length >= 8,
    },
  ],
  abortEarly: true,
});

const result = await loginValidator.execute({
  email: "",
  password: "123",
});

console.log(result.notification.length); // 1 — only the first error
```

### Combine transform + condition + abortEarly

Features can be freely combined. The execution order within each rule follows the pipeline: **transform → condition → runValidate**.

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
      error: () => "Total must be positive",
      runValidate: (data) => data.total > 0,
    },
    {
      key: "couponCode",
      error: () => "Invalid coupon",
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

### Create custom patterns

When default mappers aren't enough, you can extend `NotificationPattern` and `ResultPattern` with domain-specific fields.

**Custom notification with error type:**

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
      error: () => "Invalid email",
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
  name: "John",
  email: "invalid",
});

console.log(result.isValid); // false
console.log(result.errors[0].field); // "email"
console.log(result.errors[0].type); // "error"
```

### Integrate with REST APIs

Use custom mappers to generate responses in the format your API expects.

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
      error: () => "Name is required",
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Invalid email",
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
    message: notif.length === 0 ? "OK" : "Validation error",
    payload: notif.length === 0 ? data : undefined,
    errors: notif.map((n) => ({
      field: n.field,
      reason: n.message,
    })),
  }),
});

const result = await apiValidator.execute({
  name: "John",
  email: "john@email.com",
});

// result.status === 200
// result.errors === []
// Usage in an Express/Fastify controller:
// res.status(result.status).json(result);
```

---

### Pass context to rules

The `C` generic parameter allows you to pass a context object (`context`) that is available in all rule callbacks. This is useful for injecting dependencies like database connections, request objects, or any external data.

```typescript
interface DatabaseCtx {
  db: DatabaseConnection;
  userId: string;
}

interface User {
  email: string;
}

const validator = new SchemaValidator<User, NotificationPattern, ResultPattern<User>, DatabaseCtx>({
  schema: [
    {
      key: "email",
      error: (data, ctx) => `Email already registered for user ${ctx.userId}`,
      description: (data, ctx) => `Checks email uniqueness for tenant ${ctx.userId}`,
      runValidate: async (data, ctx) => {
        const exists = await ctx.db.findByEmail(data.email);
        return !exists;
      },
    },
  ],
});

const db = await connectToDatabase();
const result = await validator.execute({ email: "test@email.com" }, { db, userId: "usr_123" });
```

By default, `C = {}` — if you don't pass a context, TypeScript doesn't require the second argument in `execute()` and callbacks receive `{}` as `context`.

---

### Filter rules by groups, pick, and omit

The third parameter of `execute` lets you filter which rules run without modifying the original schema.

**groups:** only run rules that belong to specific groups.

```typescript
interface User {
  name: string;
  email: string;
  password: string;
}

const validator = new SchemaValidator<User>({
  schema: [
    {
      key: "name",
      error: () => "Name is required",
      groups: ["create", "update"],
      runValidate: (data) => data.name.trim().length > 0,
    },
    {
      key: "email",
      error: () => "Invalid email",
      groups: ["create", "update"],
      runValidate: (data) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    },
    {
      key: "password",
      error: () => "Minimum 8 characters",
      groups: ["create"],
      runValidate: (data) => data.password.length >= 8,
    },
  ],
});

// Only rules from the "create" group
const result = await validator.execute(data, {}, { groups: ["create"] });
```

**pick:** only run rules whose `key` **or** `groups` matches the list.

```typescript
// By field
const result = await validator.execute(data, {}, { pick: ["name", "email"] });

// By group
const result = await validator.execute(data, {}, { pick: ["admin", "audit"] });
```

**omit:** run all rules except those whose `key` **or** `groups` matches the list.

```typescript
// By field
const result = await validator.execute(data, {}, { omit: ["password"] });

// By group
const result = await validator.execute(data, {}, { omit: ["admin"] });
```

Rules **without `groups`** always run regardless of the groups filter. Filters can be combined: `{ groups: ["create"], pick: ["name", "email"] }`. Both `pick` and `omit` check **both** `rule.key` and `rule.groups` simultaneously — if either one matches, the rule is included (pick) or excluded (omit).

---

## API Reference

### `SchemaValidator<T, N, R, C>`

Main class. Implements `Command<T, R, C>`.

| Generic parameter | Default | Description |
|---|---|---|
| `T extends object` | — | Type of the object to validate |
| `N extends NotificationPattern` | `NotificationPattern` | Error notification type |
| `R extends ResultPattern<T>` | `ResultPattern<T>` | Result type |
| `C extends object` | `{}` | Context passed to all rule callbacks |

**Constructor:**

```typescript
new SchemaValidator<T, N, R, C>({
  schema: Rule<T, C>[];
  notificationMappers?: (rule: Rule<T, C>, data: T, context: C) => N;
  resultMappers?: (data: T, notif: N[]) => R;
  abortEarly?: boolean;
})
```

| Option | Required | Default | Description |
|---|---|---|---|
| `schema` | Yes | — | Array of validation rules |
| `notificationMappers` | No | default mapper | Customizes how notifications are generated |
| `resultMappers` | No | default mapper | Customizes how the result is assembled |
| `abortEarly` | No | `false` | If `true`, stops on first error |

**Methods:**

| Method | Return | Description |
|---|---|---|
| `execute(data: T, context: C, options?: OptionsCommand)` | `Promise<R>` | Runs the rules (with optional filter) and returns the result |
| `validation(data: T, context: C, options?: OptionsCommand)` | `Promise<R>` | Internal alias — same behavior as `execute` |

### Exported types

```typescript
import type {
  NotificationPattern,
  ResultPattern,
  Rule,
  Command,
  OptionsCommand,
} from "@felipe-lib/schema-local/types";
```

#### `Rule<T, C>`

```typescript
interface Rule<T, C> {
  key: keyof T;
  error: (data: T, context: C) => string;
  groups?: string[];
  transform?: (data: T, context: C) => T | Promise<T>;
  condition?: (data: T, context: C) => boolean | Promise<boolean>;
  runValidate(data: T, context: C): boolean | Promise<boolean>;
  description?: (data: T, context: C) => string;
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

#### `Command<T, R, C>`

```typescript
interface Command<T extends object, R extends object, C extends object> {
  execute(data: T, context: C, { groups, pick, omit }: OptionsCommand): Promise<R>;
}

interface OptionsCommand {
  groups?: string[];
  pick?: string[];
  omit?: string[];
}
```

---

## Features

- **Zero dependencies** — no external libraries required
- **NotificationPattern** — standardized error notifications
- **ResultPattern** — standardized result with `success`, `notification[]`, and `data`
- **Customizable mappers** — personalize notification and result formats
- **Sync/async support** — all callbacks accept both synchronous and asynchronous functions
- **`transform`** — modify data before validation (chained across rules)
- **`condition`** — execute rules only when a condition is met
- **`abortEarly`** — stop on first error
- **Continuous validation** — run all rules and collect all errors (default)
- **Fully typed** — native TypeScript with generics
- **Command Pattern** — `Command<T, R>` interface for Command Bus / Mediator integration
- **`groups`, `pick`, `omit` filtering** — run only specific rules without modifying the schema
- **Agnostic** — works with any object shape

---

## License

MIT © Felca
