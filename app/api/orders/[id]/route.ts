import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateOrderSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Build where clause based on user role
    const where: any = { id };
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      where.userId = session.user.id;
    }

    const order = await prisma.order.findFirst({
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
          take: 50, // Last 50 progress entries
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    // Check if user owns the order or is admin
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        ...(session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
          ? {}
          : { userId: session.user.id }),
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
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
          take: 10,
        },
      },
    });

    // Create notification for status changes
    if (validatedData.status && validatedData.status !== existingOrder.status) {
      const statusMessages = {
        PROCESSING: 'تم بدء معالجة طلبك',
        COMPLETED: 'تم اكتمال طلبك بنجاح',
        CANCELLED: 'تم إلغاء طلبك',
        FAILED: 'فشل في معالجة طلبك',
        PAUSED: 'تم إيقاف طلبك مؤقتاً',
      };

      if (statusMessages[validatedData.status as keyof typeof statusMessages]) {
        await prisma.notification.create({
          data: {
            userId: existingOrder.userId,
            title: 'تحديث حالة الطلب',
            message: statusMessages[validatedData.status as keyof typeof statusMessages],
            type: validatedData.status === 'COMPLETED' ? 'SUCCESS' : 
                  validatedData.status === 'FAILED' ? 'ERROR' : 'INFO',
            actionUrl: `/dashboard/orders/${id}`,
          },
        });
      }
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Order PATCH error:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if user owns the order or is admin
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        ...(session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
          ? {}
          : { userId: session.user.id }),
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Can only delete pending or failed orders
    if (!['PENDING', 'FAILED', 'CANCELLED'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'Cannot delete order in current status' },
        { status: 400 }
      );
    }

    // Soft delete - update status to cancelled
    const deletedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: existingOrder.userId,
        title: 'تم حذف الطلب',
        message: 'تم حذف طلبك بنجاح',
        type: 'INFO',
      },
    });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Start transfer endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'start_transfer') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check if user owns the order
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: 'PENDING',
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not in pending status' },
        { status: 404 }
      );
    }

    // Update order status to processing
    await prisma.order.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'تم بدء عملية النقل',
        message: 'تم بدء عملية نقل الأعضاء بنجاح',
        type: 'SUCCESS',
        actionUrl: `/dashboard/orders/${id}`,
      },
    });

    // Here you would typically trigger the actual transfer process
    // This could be done via a queue system or background job

    return NextResponse.json({ 
      message: 'Transfer started successfully',
      orderId: id 
    });
  } catch (error) {
    console.error('Start transfer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
