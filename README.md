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

Código de status HTTP em português brasileiro para padronizar respostas de API.

### Uso

```typescript
import { CodigoStatus } from "@felca/schema-validation";

// Acesso ao código numérico
const statusCode = CodigoStatus.OK; // 200

// Uso em resposta de API
const response = {
    status: CodigoStatus.OK,
    message: CodigoStatus.OK,
    data: { /* ... */ },
};

// Converter código para nome
const statusName = Object.keys(CodigoStatus).find(
    key => CodigoStatus[key as keyof typeof CodigoStatus] === 200
); // "OK"
```

### Códigos disponíveis

| Código | Nome | Descrição |
|--------|------|------------|
| 100 | CONTINUAR | O servidor recebeu os cabeçalhos da requisição |
| 101 | TROCAR_PROTOCOLO | O servidor está trocando de protocolo |
| 102 | PROCESSANDO | O servidor está processando a requisição |
| 103 | DICAS_ANTECIPADAS | O servidor enviou dicas antecipadamente |
| **200** | **OK** | **Requisição processada com sucesso** |
| 201 | CRIADO | Novo recurso criado com sucesso |
| 202 | ACEITO | Requisição aceita para processamento |
| 203 | NAO_AUTORITATIVO | Informações de fonte alternativa |
| 204 | SEM_CONTEUDO | Requisição processada sem conteúdo |
| 205 | REDEFINIR_CONTEUDO | Redefinir visualização do formulário |
| 206 | CONTEUDO_PARCIAL | Retorno parcial do recurso |
| 207 | MULTI_STATUS | Múltiplos códigos de status |
| 208 | JA_REPORTADO | Já retornado anteriormente |
| 226 | IM_USADO | Requisição já processada |
| **300** | **MULTIPLAS_OPCOES** | **Múltiplas representações disponíveis** |
| 301 | MOVIDO_PERMANENTEMENTE | Recurso movido permanentemente |
| 302 | ENCONTRADO | Recurso movido temporariamente |
| 303 | VER_OUTRO | Recurso disponível em outra URL |
| 304 | NAO_MODIFICADO | Recurso não modificado |
| 305 | USAR_PROXY | Acesso via proxy |
| 307 | REDIRECIONAMENTO_TEMPORARIO | Redirecionamento temporário |
| 308 | REDIRECIONAMENTO_PERMANENTE | Redirecionamento permanente |
| **400** | **REQUISICAO_INVALIDA** | **Sintaxe da requisição inválida** |
| 401 | NAO_AUTENTICADO | Autenticação necessária |
| 402 | PAGAMENTO_NECESSARIO | Pagamento requerido |
| 403 | PROIBIDO | Permissão negada |
| 404 | NAO_ENCONTRADO | Recurso não encontrado |
| 405 | METODO_NAO_PERMITIDO | Método HTTP não permitido |
| 406 | NAO_ACEITAVEL | Parâmetros não aceitáveis |
| 407 | AUTENTICACAO_PROXY_NECESSARIA | Autenticação com proxy necessária |
| 408 | TEMPO_ESGOTADO | Tempo de espera esgotado |
| 409 | CONFLITO | Conflito com estado do recurso |
| 410 | RECURSO_REMOVIDO | Recurso removido |
| 411 | TAMANHO_NECESSARIO | Content-Length obrigatório |
| 412 | PRE_CONDICAO_FALHOU | Condições não atendidas |
| 413 | CORPO_MUITOS_GRANDE | Corpo da requisição muito grande |
| 414 | URI_MUITOS_LONGA | URI muito longa |
| 415 | TIPO_MIDIA_NAO_SUPORTADO | Tipo de mídia não suportado |
| 416 | RANGE_INVALIDO | Intervalo de bytes inválido |
| 417 | EXPECTATIVA_FALHOU | Expectativa não atendida |
| 418 | CHALEIRA | Servidor recusa preparar café (418 I'm a teapot) |
| 421 | REQUISICAO_MAL_DIRECIONADA | Requisição mal direcionada |
| 422 | ENTIDADE_INPROCESSAVEL | Entidade não processável |
| 423 | RECURSO_BLOQUEADO | Recurso bloqueado |
| 424 | DEPENDENCIA_FALHOU | Dependência falhou |
| 425 | CONEXAO_REJEITADA | Conexão rejeitada |
| 426 | ATUALIZACAO_NECESSARIA | Atualização necessária |
| 428 | PRE_CONDICAO_NECESSARIA | Pré-condição obrigatória |
| 429 | MUITAS_REQUISICOES |Muitas requisições em pouco tempo |
| 431 | CABECALHOS_MUITOS_GRANDES | Cabeçalhos muito grandes |
| 451 | INDISPONIVEL_POR_MOTIVOS_LEGAIS | Removido por motivos legais |
| **500** | **ERRO_INTERNO_SERVIDOR** | **Erro inesperado no servidor** |
| 501 | NAO_IMPLEMENTADO | Funcionalidade não implementada |
| 502 | GATEWAY_INVALIDO | Gateway recebeu resposta inválida |
| 503 | SERVICO_INDISPONIVEL | Serviço temporariamente indisponível |
| 504 | TEMPO_GATEWAY_ESGOTADO | Gateway sem resposta a tempo |
| 505 | VERSAO_HTTP_NAO_SUPORTADA | Versão HTTP não suportada |
| 506 | VARIANTE_TAMBEM_NEGOCIA | Erro de negociação de conteúdo |
| 507 | ARMAZENAMENTO_INSUFICIENTE | Espaço insuficiente |
| 508 | LOOP_DETECTADO | Loop infinito detectado |
| 510 | NAO_EXTENDIDO | Mais extensões necessárias |
| 511 | AUTENTICACAO_REDE_NECESSARIA | Autenticação de rede necessária |