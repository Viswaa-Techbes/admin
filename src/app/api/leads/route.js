import { NextResponse } from 'next/server';
import { LeadService } from '@/services/leadService';
import { leadSchema } from '@/validation/lead.schema';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Optional: Validate with Zod
    const validated = leadSchema.parse(body);

    const newLead = await LeadService.createLead(validated);
    return NextResponse.json({ success: true, data: newLead });

  } catch (err) {
    const status = err.name === 'ZodError' ? 400 : 500;
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status });
  }
}

export async function GET() {
  try {
    const leads = await LeadService.getAllLeads();
    return NextResponse.json({
      success: true,
      data: leads
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 500 });
  }
}
