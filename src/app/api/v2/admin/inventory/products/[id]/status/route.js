import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Material from '@/models/Material';

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
    console.error('Error toggling product status in admin:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
