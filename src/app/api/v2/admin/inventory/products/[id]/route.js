import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Material from '@/models/Material';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const product = await Material.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

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

    if (name !== undefined) {
      if (!String(name).trim()) {
        return NextResponse.json({ success: false, message: 'Product name cannot be empty' }, { status: 400 });
      }
      product.name = String(name).trim();
    }

    if (brand !== undefined) product.brand = String(brand).trim();
    if (category !== undefined) product.category = String(category).trim();
    if (subcategory !== undefined) product.subcategory = String(subcategory).trim();
    if (modelNumber !== undefined) product.modelNumber = String(modelNumber).trim();
    if (variant !== undefined) product.variant = String(variant).trim();
    if (specifications !== undefined) product.specifications = String(specifications).trim();
    if (unit !== undefined) product.unit = String(unit).trim();
    if (image !== undefined) product.image = String(image).trim();
    if (description !== undefined) product.description = String(description).trim();
    if (status !== undefined) product.status = status === 'inactive' ? 'inactive' : 'active';
    if (isTaxInclusive !== undefined) product.isTaxInclusive = Boolean(isTaxInclusive);
    if (Array.isArray(variants)) product.variants = variants;

    if (basePrice !== undefined || price !== undefined) {
      const p = Math.max(0, Number(basePrice ?? price ?? 0));
      product.basePrice = p;
      product.price = p;
    }

    if (gstRate !== undefined) {
      product.gstRate = Math.max(0, Math.min(100, Number(gstRate) || 0));
    }

    if (stock !== undefined) {
      product.stock = Math.max(0, parseInt(stock, 10) || 0);
    }

    if (minStock !== undefined) {
      product.minStock = Math.max(0, parseInt(minStock, 10) || 0);
    }

    if (sku !== undefined) {
      const cleanSku = String(sku || '').trim().toUpperCase();
      if (cleanSku && cleanSku !== product.sku) {
        const existing = await Material.findOne({ sku: cleanSku, _id: { $ne: id } }).lean();
        if (existing) {
          return NextResponse.json(
            { success: false, message: `A product with SKU "${cleanSku}" already exists` },
            { status: 400 }
          );
        }
      }
      product.sku = cleanSku;
    }

    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (err) {
    console.error('Error updating product in admin:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const product = await Material.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Safe deactivation / soft delete
    product.status = 'inactive';
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product deactivated safely',
      data: product,
    });
  } catch (err) {
    console.error('Error deactivating product in admin:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
