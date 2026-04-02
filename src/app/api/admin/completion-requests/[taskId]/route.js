import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const { response, payload } = await fetchBackend(`/admin/completion-requests/${params.taskId}`, {
      method: 'PATCH',
      token: getAuthToken(req),
      body,
    });

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
