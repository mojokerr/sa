import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return mock payment methods
    // In production, these would come from database
    const paymentMethods = [
      {
        id: '1',
        name: 'فودافون كاش',
        type: 'vodafone_cash',
        details: {
          phone: '01234567890',
          name: 'BoostGram AI'
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '2',
        name: 'USDT (TRC20)',
        type: 'usdt_trc20',
        details: {
          address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
          network: 'TRC20'
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '3',
        name: 'RedotPay',
        type: 'redotpay',
        details: {
          email: 'payments@boostgram.ai',
          merchant_id: 'BG_MERCHANT_001'
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Payment methods GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create payment methods
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, details } = body;

    // Validate required fields
    if (!name || !type || !details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, save to database
    const paymentMethod = {
      id: Date.now().toString(),
      name,
      type,
      details,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    return NextResponse.json({ paymentMethod }, { status: 201 });
  } catch (error) {
    console.error('Payment methods POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}