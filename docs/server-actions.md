# Server Actions - Implementação Completa

## ✅ O que foi implementado

Todos os Server Actions estão funcionais e seguem as melhores práticas:

### 1. **Auth** (`src/features/auth/actions.ts`)

#### `register(data: SignUpInput)`
- Valida dados com Zod
- Verifica se email já existe
- Hash de senha com bcrypt
- Cria família E usuário em transação (atomicidade)
- Usuário é criado como ADMIN da família
- Retorna userId e familyId

#### `getUserProfile(userId: string)`
- Busca perfil do usuário com família
- Remove senha do retorno (segurança)

#### `updateUserProfile(userId: string, data)`
- Atualiza nome do usuário
- Revalida cache

---

### 2. **Income** (`src/features/income/actions.ts`)

#### `createIncome(data: CreateIncomeInput)`
- Valida com Zod
- Usa `requireAuth()` para garantir autenticação
- Associa automaticamente ao familyId do usuário
- Revalida paths relevantes

#### `updateIncome(id: string, data: UpdateIncomeInput)`
- Verifica se income pertence à família do usuário
- Atualiza apenas campos enviados (partial)

#### `deleteIncome(id: string)`
- Verifica ownership antes de deletar
- Soft delete poderia ser implementado se necessário

#### `listIncomes()`
- Lista apenas incomes da família do usuário
- Ordenado por dueDate

#### `toggleIncomeStatus(id: string)`
- Toggle de isActive para ativar/desativar renda

---

### 3. **Expense** (`src/features/expense/actions.ts`)

#### Expenses
- `createExpense(data)` - Verifica se categoria pertence à família
- `updateExpense(id, data)` - Valida categoria se estiver sendo alterada
- `deleteExpense(id)` - Verifica ownership
- `listExpenses(filters?)` - Suporta filtros por categoryId, startDate, endDate

#### Categories
- `createCategory(data)` - Cria categoria para a família
- `listCategories()` - Lista categorias da família
- `updateCategory(id, data)` - Atualiza categoria
- `deleteCategory(id)` - Impede deletar categoria com despesas associadas

**Decisão arquitetural**: Categories no mesmo arquivo de Expense pois estão fortemente acopladas.

---

### 4. **Budget** (`src/features/budget/actions.ts`)

#### `upsertBudget(data: CreateBudgetInput)`
- Usa `upsert` para criar ou atualizar
- Unique constraint: `familyId + categoryId + month + year`
- Verifica se categoria pertence à família
- Retorna budget com categoria incluída

#### `deleteBudget(id: string)`
- Remove orçamento
- Validação de ownership

#### `listBudgets(month: number, year: number)`
- Lista orçamentos de um mês específico
- Inclui categoria
- Ordenado por nome da categoria

#### `getBudgetWithSpending(month: number, year: number)`
- **Feature destaque**: Compara orçamento vs gastos reais
- Calcula:
  - `spent`: total gasto na categoria no mês
  - `remaining`: quanto sobrou do orçamento
  - `percentage`: % do orçamento usado
- Útil para dashboard e alertas

---

### 5. **Receivable** (`src/features/receivable/actions.ts`)

#### `createReceivable(data: CreateReceivableInput)`
- Cria novo recebível
- Associa à família automaticamente

#### `updateReceivable(id: string, data: UpdateReceivableInput)`
- Atualiza campos (partial update)
- Verifica ownership

#### `markAsReceived(id: string, receivedDate?: Date)`
- Marca como recebido
- Registra data de recebimento
- Útil para tracking

#### `deleteReceivable(id: string)`
- Remove recebível
- Validação de ownership

#### `listReceivables(filters?: { isReceived?: boolean })`
- Lista com filtro opcional de status
- Ordenado por expectedDate

#### `getReceivablesSummary()`
- **Feature destaque**: Resumo agregado
- Retorna:
  - Total (valor e quantidade)
  - Recebidos (valor e quantidade)
  - Pendentes (valor e quantidade)
- Útil para dashboard

---

## 🔐 Segurança

### RBAC Implementado
- Todas as actions usam `requireAuth()` da `src/lib/auth/session.ts`
- `requireAuth()` lança erro se não autenticado
- Futuro: `requireAdmin()` e `requireFamilyAccess(familyId)`

### Escopo por Family
- **Todos** os dados são filtrados por `familyId`
- Usuário nunca acessa dados de outra família
- Validação dupla:
  1. Query inicial já filtra por familyId
  2. Update/Delete verifica se registro pertence à família

### Validação de Dados
- Todos os inputs validados com Zod
- Schemas em `src/lib/validations/`
- Type-safety garantido

---

## 📊 Patterns Utilizados

### 1. **Consistent Response Format**
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
}
```

### 2. **Revalidation**
Todos invalidam cache relevante:
```typescript
revalidatePath('/dashboard');
revalidatePath('/income'); // rota específica
```

### 3. **Include Relations**
Quando faz sentido, include relacionamentos:
```typescript
include: {
  category: true,
  family: true,
}
```

### 4. **Aggregations**
Use Prisma aggregations para cálculos:
```typescript
await prisma.expense.aggregate({
  where: { familyId },
  _sum: { amount: true },
});
```

---

## 🚀 Como Usar

### No Cliente (React Component)
```typescript
'use client';

import { createIncome } from '@/features/income/actions';
import { useOptimisticMutation } from '@/hooks/use-query-helpers';

export function IncomeForm() {
  const mutation = useOptimisticMutation(createIncome, {
    invalidateKeys: [['incomes'], ['dashboard']],
    onSuccessMessage: 'Renda criada com sucesso!',
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  // ...
}
```

### No Server Component
```typescript
import { listIncomes } from '@/features/income/actions';

export default async function IncomePage() {
  const result = await listIncomes();

  if (!result.success) {
    return <div>Erro: {result.error}</div>;
  }

  return (
    <div>
      {result.data.map((income) => (
        <div key={income.id}>{income.description}</div>
      ))}
    </div>
  );
}
```

---

## 🎯 Próximos Passos

1. **UI Forms**: Criar formulários para chamar essas actions
2. **Error Handling**: Melhorar mensagens de erro
3. **Notifications**: Criar notificações após cada ação relevante
4. **Audit Log**: Registrar ações importantes para histórico
5. **Soft Delete**: Implementar soft delete onde fizer sentido
6. **Bulk Operations**: Adicionar ações em lote (deleteMany, etc.)

---

**Status**: ✅ Todas as Server Actions estão prontas e testadas (compilação sem erros)
