'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signUpSchema, SignUpInput } from '@/lib/validations/auth';
import { revalidatePath } from 'next/cache';

/**
 * Register new user
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

    // Create user as ADMIN
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: {
        userId: user.id,
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
