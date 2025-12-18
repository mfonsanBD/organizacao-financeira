# Decisões Arquiteturais

## 🏗️ Estrutura do Projeto

### Organização por Domínio (Feature-based)
Ao invés de organizar por tipo técnico (components/, services/, etc.), organizamos por domínio de negócio (`features/`). Isso facilita:
- Encontrar todo código relacionado a uma funcionalidade
- Manter alta coesão e baixo acoplamento
- Escalar o projeto com novos domínios

### Domínios Implementados
- `auth/` - Autenticação e autorização
- `family/` - Conceito central: grupo financeiro
- `income/` - Renda fixa mensal
- `expense/` - Despesas fixas e avulsas
- `budget/` - Orçamento por categoria
- `receivable/` - Valores a receber
- `dashboard/` - Visão geral financeira
- `report/` - Relatórios e exportação
- `notification/` - Sistema de notificações

## 🔐 Autenticação e Autorização

### NextAuth com Credentials Provider
- **Por quê?** Controle total sobre lógica de autenticação
- **Session Strategy**: JWT (melhor para serverless)
- **Callbacks personalizados** para incluir `role` e `familyId` na sessão

### RBAC (Role-Based Access Control)
```typescript
enum Role {
  ADMIN   // Pode adicionar/remover membros, configurar família
  MEMBER  // Acesso aos dados, sem permissões administrativas
}
```

### Helpers de Autenticação
- `getSession()` - Obter sessão atual
- `getCurrentUser()` - Obter usuário ou null
- `requireAuth()` - Exigir autenticação (throw error)
- `requireAdmin()` - Exigir role ADMIN
- `requireFamilyAccess(familyId)` - Validar acesso à família

**Importante**: Todas as validações acontecem no backend. Frontend apenas oculta UI.

## 👨‍👩‍👧‍👦 Conceito de Family

### Escopo de Dados
- **Todos os dados financeiros** pertencem a uma `Family`
- Queries sempre filtram por `familyId`
- Usuário só vê dados da sua própria família
- Mudança de família = novo contexto completo

### Relacionamentos
```
Family
  ├── User[] (membros)
  ├── Income[]
  ├── Expense[]
  ├── Category[]
  ├── Budget[]
  ├── Receivable[]
  └── Notification[]
```

## 💾 Banco de Dados

### Prisma + PostgreSQL (Neon)
- **Prisma Client**: Type-safe, excelente DX
- **Neon**: PostgreSQL serverless, escalável
- **Migrations**: Versionamento de schema

### Adapter do PostgreSQL
Com Prisma 7, precisamos usar adapter explicitamente:
```typescript
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

### Indexes Estratégicos
- `familyId` em todas as tabelas (queries sempre filtram por família)
- `email` em User (login)
- `paymentDate` em Expense (ordenação por data)
- `expectedDate` em Receivable (ordenação)
- Unique constraint em Budget por `[familyId, categoryId, month, year]`

## 📴 Offline-First

### IndexedDB (Dexie)
- **Schema espelhado** do Prisma
- Campo `synced: boolean` em todos os registros
- Dados salvos primeiro localmente

### Lógica de Sincronização
1. **Write**: Salva em IndexedDB com `synced: false`
2. **Quando online**: Envia para backend
3. **Sucesso**: Marca como `synced: true`
4. **Pull**: Baixa dados do servidor periodicamente
5. **Conflict Resolution**: `updatedAt` mais recente vence

### Auto-sync
- Evento `online` dispara sincronização
- Polling a cada 5 minutos (se online)

## ⚡ Tempo Real

### Polling Inteligente com React Query
```typescript
useRealtimeQuery(queryKey, queryFn, {
  refetchInterval: 5000, // 5 segundos
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});
```

**Por que polling ao invés de WebSockets/SSE?**
- Mais simples de implementar inicialmente
- Funciona bem com serverless (Neon, Vercel)
- Preparado para migrar para SSE no futuro

### Invalidação de Cache
- Mutations invalidam queries relacionadas automaticamente
- Usuários veem atualizações de outros membros da família em ~5s

## 🎨 UI

### shadcn/ui
- Componentes acessíveis e customizáveis
- Tailwind CSS para estilização
- Não é biblioteca de terceiros (você é dono do código)

### Componentes Instalados
- Button, Input, Label, Card
- Form (integrado com React Hook Form)
- Select, Dialog, DropdownMenu
- Tabs, Sonner (toast notifications)

## ✅ Validação

### Zod
- Schemas de validação compartilhados (frontend + backend)
- Type-safe (tipos TypeScript inferidos)
- Mensagens de erro customizadas

### React Hook Form
- Performance (re-renders minimizados)
- Integração perfeita com Zod
- Validação assíncrona quando necessário

## 📱 PWA

### Configuração Atual
- `manifest.json` configurado
- Meta tags PWA no layout
- **Service Worker**: Simplificado por incompatibilidade com Turbopack

**Nota**: next-pwa usa webpack e não é compatível com Turbopack (Next.js 16). Por enquanto:
- Manifest permite instalação
- IndexedDB garante offline-first (mais importante)
- Service worker pode ser implementado manualmente com Workbox

## 🔔 Notificações

### Push Notifications (A implementar)
- Criadas após persistência no backend
- Enviadas para todos os usuários da mesma família
- Link direto para recurso criado
- Campo `isRead` para marcar como lida

## 🚀 Deploy

### Recomendações
- **Vercel**: Melhor integração com Next.js
- **Neon**: PostgreSQL serverless
- **Variáveis de Ambiente**: Configurar DATABASE_URL e NEXTAUTH_SECRET

## 📊 Próximas Implementações

1. **Server Actions** para cada domínio
2. **UI de autenticação** (login/register)
3. **Dashboard** com métricas
4. **Formulários** de entrada de dados
5. **Gráficos** com Chart.js ou Recharts
6. **Exportação XLSX** com SheetJS
7. **Sistema de notificações** completo
8. **Service Worker** customizado (Workbox)

---

**Data**: 18/12/2025  
**Versão**: 1.0.0 - Setup Inicial
