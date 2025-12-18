'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth/session';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * List all users in the family
 */
export async function listUsers() {
  try {
    const user = await requireAuth();

    const users = await prisma.user.findMany({
      where: {
        familyId: user.familyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error('List users error:', error);
    return {
      success: false,
      error: 'Erro ao listar usuários',
      data: [],
    };
  }
}

/**
 * Create new user (Admin only)
 */
export async function createUser(data: CreateUserInput) {
  try {
    const currentUser = await requireAdmin();
    const validatedData = createUserSchema.parse(data);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Email já cadastrado',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        familyId: currentUser.familyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    revalidatePath('/users');

    return {
      success: true,
      data: newUser,
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar usuário',
    };
  }
}

/**
 * Update user (Admin only)
 */
export async function updateUser(id: string, data: UpdateUserInput) {
  try {
    const currentUser = await requireAdmin();
    const validatedData = updateUserSchema.parse(data);

    // Verify user belongs to the same family
    const existingUser = await prisma.user.findFirst({
      where: { id, familyId: currentUser.familyId },
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    // Prevent admin from demoting themselves
    if (id === currentUser.id && validatedData.role === 'MEMBER') {
      return {
        success: false,
        error: 'Você não pode remover seu próprio privilégio de administrador',
      };
    }

    // Check if email is already in use by another user
    if (validatedData.email) {
      const emailInUse = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id },
        },
      });

      if (emailInUse) {
        return {
          success: false,
          error: 'Email já está em uso',
        };
      }
    }

    // Build update data object
    const updateData: {
      name?: string;
      email?: string;
      role?: Role;
      password?: string;
    } = {};

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    revalidatePath('/users');

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error('Update user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
    };
  }
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(id: string) {
  try {
    const currentUser = await requireAdmin();

    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      return {
        success: false,
        error: 'Você não pode excluir sua própria conta',
      };
    }

    // Verify user belongs to the same family
    const existingUser = await prisma.user.findFirst({
      where: { id, familyId: currentUser.familyId },
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath('/users');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      success: false,
      error: 'Erro ao excluir usuário',
    };
  }
}
