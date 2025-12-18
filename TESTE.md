# 🧪 Guia de Testes - Sistema de Organização Financeira Familiar

## ✅ Funcionalidades Implementadas

### 1. Autenticação
- ✅ Registro de usuário com criação automática de família
- ✅ Login com email e senha
- ✅ Logout
- ✅ Proteção de rotas (redirecionamento se não autenticado)

### 2. Dashboard
- ✅ Resumo financeiro com 4 cards principais
- ✅ Gráfico de pizza: Despesas por Categoria
- ✅ Orçamento vs Gastos com barras de progresso
- ✅ Estado vazio com links para adicionar dados

### 3. Gestão de Categorias (`/categories`)
- ✅ Criar categoria com nome e cor
- ✅ Editar categoria
- ✅ Excluir categoria (com validação se há despesas)
- ✅ Visualização em grid com cores

### 4. Gestão de Rendas (`/income`)
- ✅ Adicionar renda mensal fixa
- ✅ Editar renda
- ✅ Ativar/desativar renda
- ✅ Excluir renda
- ✅ Visualização do total de rendas ativas

### 5. Gestão de Despesas (`/expense`)
- ✅ Adicionar despesa com categoria
- ✅ Despesas recorrentes (mensal/anual/personalizado)
- ✅ Editar despesa
- ✅ Excluir despesa
- ✅ Agrupamento por categoria
- ✅ Filtro automático do mês atual

### 6. Gestão de Orçamentos (`/budget`)
- ✅ Criar orçamento mensal por categoria
- ✅ Editar orçamento
- ✅ Excluir orçamento
- ✅ Visualização de progresso (gasto/total)
- ✅ Indicação de orçamento excedido

### 7. Gestão de Recebíveis (`/receivable`)
- ✅ Adicionar valor a receber
- ✅ Marcar como recebido
- ✅ Editar recebível
- ✅ Excluir recebível
- ✅ Separação entre pendentes e recebidos
- ✅ Resumo de totais

### 8. Navegação
- ✅ Sidebar responsiva (desktop + mobile)
- ✅ Menu hambúrguer para mobile
- ✅ Exibição de nome/email do usuário
- ✅ Botão de logout

---

## 🧪 Roteiro de Testes

### Pré-requisitos
```bash
# 1. Certifique-se que o servidor está rodando
npm run dev

# 2. Acesse http://localhost:3000
```

### Teste 1: Primeiro Acesso
1. Acesse `http://localhost:3000`
2. Deve redirecionar para `/auth/signin`
3. Clique em "Criar conta"
4. Preencha:
   - Nome: Seu Nome
   - Email: teste@email.com
   - Senha: 123456
   - Nome da Família: Família Teste
5. Clique em "Criar conta"
6. Deve fazer login automaticamente e redirecionar para `/dashboard`

### Teste 2: Criar Categorias
1. Navegue para **Categorias** (sidebar)
2. Clique em "Nova Categoria"
3. Crie as seguintes categorias:
   - Alimentação (cor: #FF6B6B)
   - Transporte (cor: #4ECDC4)
   - Saúde (cor: #45B7D1)
   - Lazer (cor: #FFA07A)
   - Moradia (cor: #98D8C8)
4. Verifique que todas aparecem no grid com suas cores

### Teste 3: Adicionar Rendas
1. Navegue para **Rendas**
2. Clique em "Nova Renda"
3. Adicione:
   - Descrição: Salário
   - Valor: 5000
   - Dia do Vencimento: 5
   - Renda ativa: ✓
4. Adicione outra:
   - Descrição: Freelance
   - Valor: 1500
   - Dia do Vencimento: 15
   - Renda ativa: ✓
5. Verifique que o total mostra R$ 6.500,00

### Teste 4: Adicionar Despesas
1. Navegue para **Despesas**
2. Adicione várias despesas:
   - Supermercado - R$ 800 - Categoria: Alimentação
   - Uber - R$ 200 - Categoria: Transporte
   - Plano de Saúde - R$ 450 - Categoria: Saúde (Recorrente: Mensal)
   - Cinema - R$ 80 - Categoria: Lazer
   - Aluguel - R$ 1500 - Categoria: Moradia (Recorrente: Mensal)
3. Verifique que aparecem agrupadas por categoria
4. Total deve ser R$ 3.030,00

### Teste 5: Criar Orçamentos
1. Navegue para **Orçamentos**
2. Crie orçamentos para o mês atual:
   - Alimentação: R$ 1.000,00
   - Transporte: R$ 300,00
   - Saúde: R$ 500,00
   - Lazer: R$ 200,00
   - Moradia: R$ 1.500,00
3. Verifique as barras de progresso
4. Observe que Lazer está em 40% (R$ 80 de R$ 200)
5. Alimentação está em 80% (R$ 800 de R$ 1.000)

### Teste 6: Adicionar Recebíveis
1. Navegue para **A Receber**
2. Adicione:
   - Descrição: Reembolso médico
   - Valor: R$ 300
   - Data Prevista: próxima semana
3. Adicione:
   - Descrição: Venda de item usado
   - Valor: R$ 150
   - Data Prevista: daqui 3 dias
   - Já foi recebido: ✓
   - Data do Recebimento: hoje
4. Verifique que mostra:
   - Pendente: R$ 300
   - Recebido: R$ 150

### Teste 7: Dashboard Completo
1. Volte para **Dashboard**
2. Verifique os cards:
   - Renda Mensal: R$ 6.500,00 (2 fontes ativas)
   - Despesas do Mês: R$ 3.030,00 (5 transações)
   - Saldo: R$ 3.470,00 (verde/positivo)
   - A Receber: R$ 300,00 (1 pendente)
3. Verifique o **gráfico de pizza** mostrando despesas por categoria
4. Verifique a seção **Orçamento vs Gastos** com barras coloridas

### Teste 8: Edição e Exclusão
1. Em **Rendas**, edite "Freelance" para R$ 2.000
2. Desative a renda "Freelance" (toggle)
3. Verifique que o total muda para R$ 5.000
4. Em **Despesas**, edite "Supermercado" para R$ 900
5. Exclua a despesa "Cinema"
6. Em **Categorias**, tente excluir "Alimentação"
   - Deve mostrar erro (há despesas vinculadas)
7. Exclua "Lazer" (não tem mais despesas)
   - Deve funcionar

### Teste 9: Responsividade
1. Redimensione a janela para mobile
2. Verifique que:
   - Sidebar some
   - Aparece menu hambúrguer
   - Cards empilham verticalmente
   - Gráfico se ajusta

### Teste 10: Logout e Relogin
1. Clique no botão "Sair"
2. Deve redirecionar para `/auth/signin`
3. Faça login novamente com:
   - Email: teste@email.com
   - Senha: 123456
4. Todos os dados devem estar salvos

---

## 🐛 Problemas Conhecidos

### Avisos não-críticos:
- ⚠️ **React Compiler warning** em formulários com `watch()` - não afeta funcionalidade
- ⚠️ **Tailwind CSS warning** sobre classes arbitrárias - apenas sugestão de estilo
- ⚠️ **TypeScript warnings** - suprimidos com `@ts-expect-error`, são incompatibilidades entre React Hook Form e Zod

### Funcionalidades pendentes:
- 🔲 Notificações push
- 🔲 Filtros de data avançados
- 🔲 Exportação XLSX
- 🔲 Gráficos de tendência temporal
- 🔲 PWA com service worker
- 🔲 Sincronização offline

---

## 📊 Cenários de Erro para Testar

### Validações de Formulário:
1. Tente criar renda sem descrição → Erro
2. Tente criar despesa com valor negativo → Erro
3. Tente criar orçamento para mês inválido (13) → Erro
4. Tente criar categoria sem nome → Erro

### Validações de Negócio:
1. Tente excluir categoria com despesas → Erro com mensagem
2. Tente criar orçamento duplicado (mesma categoria + mês/ano) → Upsert (atualiza)

### Autenticação:
1. Tente acessar `/dashboard` sem login → Redirecionamento
2. Tente fazer login com senha errada → Erro
3. Tente registrar com email já existente → Erro

---

## ✅ Checklist de Validação

- [ ] Registro e login funcionam
- [ ] Dashboard mostra dados reais
- [ ] Categorias podem ser criadas, editadas e excluídas
- [ ] Rendas podem ser gerenciadas e ativadas/desativadas
- [ ] Despesas são agrupadas por categoria
- [ ] Despesas recorrentes podem ser marcadas
- [ ] Orçamentos mostram progresso correto
- [ ] Gráfico de pizza exibe distribuição de despesas
- [ ] Recebíveis são separados entre pendentes e recebidos
- [ ] Navegação mobile funciona (hambúrguer)
- [ ] Logout funciona e redireciona
- [ ] Todos os formulários validam campos obrigatórios
- [ ] Mensagens de sucesso/erro aparecem (toast)
- [ ] Números formatados em R$ (pt-BR)

---

## 🚀 Próximos Passos Recomendados

1. **Testar fluxo completo** seguindo este roteiro
2. **Criar mais categorias e dados** para popular o sistema
3. **Verificar responsividade** em diferentes tamanhos de tela
4. **Implementar filtros de data** nas páginas de listagem
5. **Adicionar sistema de notificações**
6. **Exportação de relatórios em XLSX**

---

**Servidor rodando em:** http://localhost:3000

**Problemas?** Verifique o console do navegador (F12) e o terminal do servidor.
