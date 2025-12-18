'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryForm } from '@/features/expense/components/CategoryForm';
import { deleteCategory } from '@/features/expense/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Palette } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color?: string | null;
  createdAt: Date;
}

interface CategoriesClientProps {
  categories: Category[];
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    | {
        id: string;
        name: string;
        color?: string | null;
      }
    | undefined
  >();

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    const result = await deleteCategory(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Categoria excluída com sucesso!');
      router.refresh();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      color: category.color,
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCategory(undefined);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            Organize suas despesas por categorias personalizadas
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Palette className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma categoria cadastrada. Crie sua primeira categoria para organizar suas
              despesas!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {category.color && (
                      <div
                        className="w-6 h-6 rounded border-2 border-gray-200"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span>{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {category.color ? (
                    <span>Cor: {category.color}</span>
                  ) : (
                    <span className="italic">Sem cor definida</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        category={editingCategory}
      />
    </div>
  );
}
