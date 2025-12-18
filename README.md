# Organização Financeira Familiar

Sistema web para organização financeira familiar, desenvolvido com Next.js 14, TypeScript, Prisma, NextAuth, Zod, React Hook Form, shadcn/ui, Lucide Icons, ESLint, Prettier, PWA, IndexedDB (Dexie) e @tanstack/react-query.

## 🎯 Funcionalidades

- **Controle financeiro baseado na data de pagamento**
- **Renda fixa mensal** - Salários e rendas recorrentes
- **Contas fixas** - Despesas mensais recorrentes
- **Compras avulsas por categoria** - Controle de gastos por categoria
- **Orçamento mensal por categoria** - Planejamento e acompanhamento
- **Valores a receber** - Controle de recebíveis
- **Dashboard mensal** - Visão geral das finanças
- **Relatórios com gráficos** - Análise visual dos dados
- **Exportação para XLSX** - Relatórios exportáveis
- **Tempo real** - Atualizações automáticas via polling
- **Offline-first** - Funciona sem conexão via IndexedDB
- **Push Notifications** - Notificações de eventos importantes

## 🔐 Arquitetura

### Family (Grupo Financeiro)
- Conceito de família como grupo financeiro
- Todos os dados financeiros pertencem a uma Family
- Escopo de dados sempre baseado em `familyId`

### RBAC (Role-Based Access Control)
- **Roles**: `ADMIN`, `MEMBER`
- Permissões definidas por role
- Validação no backend e frontend

## 🛠️ Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Prisma + PostgreSQL (Neon)
- **Auth**: NextAuth (Credentials)
- **Validation**: Zod + React Hook Form
- **UI**: shadcn/ui + Lucide Icons
- **Code Quality**: ESLint + Prettier
- **PWA**: Configurado para instalação
- **Offline**: IndexedDB (Dexie) com sincronização
- **Real-time**: @tanstack/react-query com polling

## 🚀 Setup Inicial

1. **Clone e instale as dependências:**
   ```sh
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   ```sh
   cp .env.example .env
   ```
   Edite o arquivo `.env` com suas configurações de banco de dados e NextAuth.

3. **Configure o banco de dados:**
   ```sh
   npx prisma migrate dev --name init
   ```

4. **Gere o Prisma Client:**
   ```sh
   npx prisma generate
   ```

5. **Execute o projeto:**
   ```sh
   npm run dev
   ```

6. **Acesse:** [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   └── auth/              # Páginas de autenticação
├── features/              # Domínios de negócio
│   ├── auth/             # Autenticação
│   ├── family/           # Gerenciamento de família
│   ├── income/           # Renda fixa
│   ├── expense/          # Despesas
│   ├── budget/           # Orçamento
│   ├── receivable/       # Recebíveis
│   ├── dashboard/        # Dashboard
│   ├── report/           # Relatórios
│   └── notification/     # Notificações
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   └── providers/        # Context providers
├── lib/
│   ├── auth/            # Helpers de autenticação
│   ├── db/              # Dexie e sincronização
│   ├── validations/     # Schemas Zod
│   ├── prisma.ts        # Cliente Prisma
│   └── utils.ts         # Utilitários
├── hooks/               # Custom hooks
└── types/               # TypeScript types
```

## 🔄 Offline-First

O sistema usa IndexedDB (Dexie) para armazenar dados localmente:
- Todas as ações funcionam offline
- Dados salvos primeiro no IndexedDB
- Sincronização automática ao reconectar
- Resolução de conflito baseada em `updatedAt`

## ⚡ Tempo Real

Atualizações em tempo real via polling inteligente:
- Refetch automático a cada 5 segundos (configurável)
- Invalidação de cache ao reconectar
- Otimistic updates nas mutations

## 📝 Próximos Passos

1. Implementar Server Actions para cada domínio
2. Criar páginas de autenticação (login/register)
3. Implementar dashboard financeiro
4. Criar formulários de entrada de dados
5. Implementar relatórios com gráficos
6. Configurar sistema de notificações
7. Implementar exportação XLSX

## 📄 Licença

Este projeto é privado e de uso interno.
