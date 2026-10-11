import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Material from '@/models/Material';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'All' && category !== 'all') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    if (search) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { modelNumber: searchRegex },
        { sku: searchRegex },
        { variant: searchRegex },
        { category: searchRegex },
      ];
    }

    const items = await Material.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('Error fetching inventory products in admin:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name,
      brand,
      category,
      subcategory,
      modelNumber,
      sku,
      variant,
      specifications,
      price,
      basePrice,
      gstRate,
      isTaxInclusive,
      stock,
      minStock,
      unit,
      image,
      description,
      status,
      variants,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ success: false, message: 'Product name is required' }, { status: 400 });
    }

    const effectivePrice = Math.max(0, Number(basePrice ?? price ?? 0));
    const effectiveGstRate = typeof gstRate === 'number' ? Math.max(0, Math.min(100, gstRate)) : 18;
    const effectiveStock = Math.max(0, parseInt(stock, 10) || 0);
    const effectiveMinStock = Math.max(0, parseInt(minStock, 10) || 0);

    const cleanSku = String(sku || '').trim().toUpperCase();
    if (cleanSku) {
      const existing = await Material.findOne({ sku: cleanSku }).lean();
      if (existing) {
        return NextResponse.json(
          { success: false, message: `A product with SKU "${cleanSku}" already exists` },
          { status: 400 }
        );
      }
    }

    const product = new Material({
      name: String(name).trim(),
      brand: String(brand || '').trim(),
      category: String(category || 'General').trim(),
      subcategory: String(subcategory || '').trim(),
      modelNumber: String(modelNumber || '').trim(),
      sku: cleanSku,
      variant: String(variant || '').trim(),
      specifications: String(specifications || '').trim(),
      basePrice: effectivePrice,
      price: effectivePrice,
      gstRate: effectiveGstRate,
      isTaxInclusive: Boolean(isTaxInclusive),
      stock: effectiveStock,
      minStock: effectiveMinStock,
      unit: String(unit || 'each').trim(),
      image: String(image || '').trim(),
      description: String(description || '').trim(),
      status: status === 'inactive' ? 'inactive' : 'active',
      variants: Array.isArray(variants) ? variants : [],
    });

    await product.save();

    return NextResponse.json(
      { success: true, message: 'Product created successfully', data: product },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating product in admin:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
