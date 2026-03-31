import { NextResponse } from 'next/server';
import { UserService } from '../../../services/userService';

export async function GET(req) {
  try {
    const users = await UserService.getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching users', error: error.message }, { status: 500 });
  }
}
