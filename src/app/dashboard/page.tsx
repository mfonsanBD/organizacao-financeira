import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="mb-8">
        <p className="text-lg">Bem-vindo, <span className="font-semibold">{session.user.name}</span>!</p>
        <p className="text-muted-foreground">Role: {session.user.role}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Renda Mensal</h3>
          <p className="text-2xl font-bold mt-2">R$ 0,00</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Despesas</h3>
          <p className="text-2xl font-bold mt-2">R$ 0,00</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Orçamento</h3>
          <p className="text-2xl font-bold mt-2">R$ 0,00</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">A Receber</h3>
          <p className="text-2xl font-bold mt-2">R$ 0,00</p>
        </div>
      </div>

      <div className="mt-8 p-6 border rounded-lg bg-muted/50">
        <h2 className="text-xl font-semibold mb-4">Próximos Passos</h2>
        <ul className="space-y-2 text-sm">
          <li>✓ Server Actions implementados para todos os domínios</li>
          <li>✓ Páginas de autenticação criadas</li>
          <li>→ Implementar formulários de entrada de dados</li>
          <li>→ Criar visualizações e gráficos</li>
          <li>→ Implementar sistema de notificações</li>
        </ul>
      </div>
    </div>
  );
}
