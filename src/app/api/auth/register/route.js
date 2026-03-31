import { NextResponse } from 'next/server';
import { AuthService } from '../../../../services/authService';
import { registerSchema } from '../../../../validation/auth.schema';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate input
    const validated = registerSchema.parse(body);

    const { user } = await AuthService.register(validated.name, validated.email, validated.password);

    return NextResponse.json({ 
      message: 'User created successfully', 
      user 
    }, { status: 201 });
  } catch (error) {
    const status = error.name === 'ZodError' ? 400 : 400;
    const message = error.name === 'ZodError' ? error.errors[0].message : error.message;
    return NextResponse.json({ message }, { status });
  }
}
