'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signUpSchema, SignUpInput } from '@/lib/validations/auth';
import { revalidatePath } from 'next/cache';

/**
 * Register new user and create family
 */
export async function register(data: SignUpInput) {
  try {
    // Validate input
    const validatedData = signUpSchema.parse(data);

    // Check if user already exists
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

    // Create family and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create family
      const family = await tx.family.create({
        data: {
          name: validatedData.familyName,
        },
      });

      // Create user as ADMIN of the family
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: 'ADMIN',
          familyId: family.id,
        },
      });

      return { family, user };
    });

    revalidatePath('/');

    return {
      success: true,
      data: {
        userId: result.user.id,
        familyId: result.family.id,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar conta',
    };
  }
}

/**
 * Get current user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        family: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    // Don't return password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return {
      success: true,
      data: userWithoutPassword,
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      error: 'Erro ao buscar perfil',
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: { name: string }) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    return {
      success: false,
      error: 'Erro ao atualizar perfil',
    };
  }
}
