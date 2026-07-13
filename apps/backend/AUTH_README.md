# Stratto API - Autenticação JWT

## 🚀 Como usar a autenticação

### 1. **Login**
```bash
POST /users/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "establishments": [...]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### 2. **Usar o token nas requisições**
Para acessar rotas protegidas, inclua o token no header:

```bash
Authorization: Bearer SEU_TOKEN_AQUI
```

**Exemplo:**
```bash
GET /products/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. **Rotas que precisam de autenticação:**
- ✅ `/establishments/*` - Todas as operações de estabelecimentos
- ✅ `/products/*` - Todas as operações de produtos
- ❌ `/users/login` - Login não precisa de token
- ❌ `/users/` (GET) - Listar usuários não precisa de token (pode mudar depois)

### 4. **Variáveis de ambiente**
Crie um arquivo `.env` baseado no `.env.example`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/stratto"
JWT_SECRET="sua-chave-secreta-super-segura-aqui"

# Neon Auth (opcional)
NEON_AUTH_URL="https://<seu-auth>.neon.tech"
NEON_AUTH_BASE_URL="https://<seu-auth>.neon.tech"
NEON_AUTH_COOKIE_SECRET="sua-chave"
NEON_AUTH_RESET_REDIRECT_URL="http://localhost:5173/reset-password"
FRONTEND_URL="http://localhost:5173"
```

### 5. **Testando com curl**

```bash
# 1. Fazer login
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"senha123"}'

# 2. Usar o token retornado
curl -X GET http://localhost:3000/products/ \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🔐 Segurança implementada

- **Senhas criptografadas** com bcrypt
- **Tokens JWT** com expiração de 24h
- **Middleware de autenticação** em rotas protegidas
- **Validação de credenciais** no login

## 📋 API Endpoints

### Usuários
- `POST /users/login` - Login local
- `POST /users/neon/login` - Login via Neon Auth (quando configurado)
- `POST /users/neon/register` - Registro via Neon Auth (quando configurado)
- `POST /users/password/reset-request` - Solicitar recuperação de senha
- `POST /users/password/reset-confirm` - Confirmar nova senha com token
- `GET /users/` - Listar usuários
- `POST /users/` - Criar usuário
- `PUT /users/:id` - Editar usuário
- `DELETE /users/:id` - Deletar usuário

### Estabelecimentos
- `GET /establishments/` - Listar estabelecimentos
- `POST /establishments/` - Criar estabelecimento
- `PUT /establishments/:id` - Editar estabelecimento
- `DELETE /establishments/:id` - Deletar estabelecimento

### Produtos
- `GET /products/` - Listar produtos (opcional: `?establishmentId=uuid`)
- `GET /products/search` - Buscar produtos (opcional: `?name=...&sku=...&establishmentId=...`)
- `POST /products/` - Criar produto
- `PUT /products/:id` - Editar produto
- `DELETE /products/:id` - Deletar produto

## 🏗️ Arquitetura

Organização por features (Domain-Driven Design):
```
src/
├── config/           # Configurações
├── features/         # Domínios de negócio
│   ├── users/        # CRUD + Login
│   ├── products/     # CRUD + Busca
│   └── establishments/ # CRUD
├── middleware/       # Middlewares (auth, errorHandler)
├── utils/           # Utilitários (errors)
└── server.ts        # Entry point
```

## 📝 Próximos passos

- Implementar refresh tokens
- Adicionar roles/permissions
- Middleware de autorização por estabelecimento