import { listCategories } from '@/features/expense/actions';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CategoriesClient } from './categories-client';

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const result = await listCategories();

  return <CategoriesClient categories={result.data || []} />;
}
