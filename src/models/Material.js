import mongoose from 'mongoose';

const MaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '', trim: true },
    category: { type: String, default: 'General', trim: true },
    subcategory: { type: String, default: '', trim: true },
    modelNumber: { type: String, default: '', trim: true },
    sku: { type: String, default: '', trim: true, uppercase: true },
    variant: { type: String, default: '', trim: true },
    specifications: { type: String, default: '', trim: true },
    unit: { type: String, default: 'each', trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    basePrice: { type: Number, min: 0 },
    gstRate: { type: Number, default: 18, min: 0, max: 100 },
    isTaxInclusive: { type: Boolean, default: false },
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    variants: [
      {
        name: { type: String, trim: true },
        sku: { type: String, trim: true },
        price: { type: Number, min: 0 },
        stock: { type: Number, default: 0 },
        specifications: { type: String, default: '' },
      },
    ],
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Material || mongoose.model('Material', MaterialSchema);
