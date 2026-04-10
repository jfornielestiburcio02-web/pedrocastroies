
"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_COOKIE_NAME = 'secureentry_session';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // In a real app, you would verify against a database with argon2 or bcrypt
  if (email === 'demo@example.com' && password === 'password123') {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, 'mock_token_' + Date.now(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return { success: true };
  }

  return { success: false, error: 'Credenciales inválidas. Intenta con demo@example.com / password123' };
}

export async function register(formData: FormData) {
  // Simulate registration logic
  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}

export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}
