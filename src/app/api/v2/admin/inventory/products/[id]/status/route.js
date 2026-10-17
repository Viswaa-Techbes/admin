import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Material from '@/models/Material';
import { fetchBackend, getAuthToken } from '@/lib/backendApi';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const product = await Material.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();

    return NextResponse.json({
      success: true,
      message: `Product is now ${product.status}`,
      data: product,
    });
  } catch (err) {
    console.error('Direct DB status update failed, falling back to backend:', err.message);
    try {
      const { id } = await params;
      const { response, payload } = await fetchBackend(`/api/v2/admin/inventory/products/${id}/status`, {
        method: 'PATCH',
        token: getAuthToken(req),
      });
      return NextResponse.json(payload, { status: response.status });
    } catch (proxyErr) {
      return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
  }
}

