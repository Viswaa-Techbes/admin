import { NextResponse } from 'next/server';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function GET(req, { params }) {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;

  try {
    const { response, payload } = await fetchBackend('/api/v2' + fullPath, {
      token: getAuthToken(req),
    });
    return NextResponse.json(payload, { status: response.status });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const body = await req.json();

  try {
    const { response, payload } = await fetchBackend('/api/v2' + path, {
      method: 'POST',
      token: getAuthToken(req),
      body,
    });
    return NextResponse.json(payload, { status: response.status });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { slug } = await params;
  const path = '/' + slug.join('/');
  const body = await req.json();

  try {
    const { response, payload } = await fetchBackend('/api/v2' + path, {
      method: 'PUT',
      token: getAuthToken(req),
      body,
    });
    return NextResponse.json(payload, { status: response.status });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { slug } = await params;
  const path = '/' + slug.join('/');

  try {
    const { response, payload } = await fetchBackend('/api/v2' + path, {
      method: 'DELETE',
      token: getAuthToken(req),
    });
    return NextResponse.json(payload, { status: response.status });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
