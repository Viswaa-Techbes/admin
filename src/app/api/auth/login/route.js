import { NextResponse } from 'next/server';
import { AuthService } from '../../../../services/authService';
import { loginSchema } from '../../../../validation/auth.schema';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate input
    const validated = loginSchema.parse(body);

    const { token, user } = await AuthService.login(validated.email, validated.password);

    const response = NextResponse.json({ 
      message: 'Logged in successfully', 
      role: user.role 
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error) {
    const status = error.name === 'ZodError' ? 400 : 401;
    const message = error.name === 'ZodError' ? error.errors[0].message : error.message;
    return NextResponse.json({ message }, { status });
  }
}
