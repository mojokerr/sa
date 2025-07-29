import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createOrderSchema, paginationSchema, orderFilterSchema } from '@/lib/validations';
import { calculateOrderPrice, estimateCompletionTime } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = paginationSchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const filters = orderFilterSchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      userId: searchParams.get('userId') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
    });

    const where: any = session.user.role === 'ADMIN' 
      ? {}
      : { userId: session.user.id };

    // Apply filters
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.userId && session.user.role === 'ADMIN') where.userId = filters.userId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          progress: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
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

    const body = await request.json();
    const { groupLink, targetGroupLink, targetCount, notes, priority } = createOrderSchema.parse(body);

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orderPrice = calculateOrderPrice(targetCount, priority);
    const requiredCredits = Math.ceil(orderPrice * 100); // Convert to credits

    if (user.credits < requiredCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${requiredCredits}, Available: ${user.credits}` },
        { status: 400 }
      );
    }

    // Create order
    const order = await prisma.$transaction(async (tx) => {
      // Deduct credits
      await tx.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: requiredCredits } },
      });

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          groupLink,
          targetCount,
          notes,
          priority,
          price: orderPrice,
          estimatedCompletion: estimateCompletionTime(targetCount, priority),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: 'Order Created Successfully',
          message: `Your order for ${targetCount.toLocaleString()} members has been created and is pending processing.`,
          type: 'SUCCESS',
          actionUrl: `/dashboard/orders/${newOrder.id}`,
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
