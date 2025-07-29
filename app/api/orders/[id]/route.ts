import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateOrderSchema } from '@/lib/validations';
import { sendEmail, getOrderCompletedEmailTemplate } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where: any = { id: params.id };
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    }

    const order = await prisma.order.findUnique({
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

    // Only admins can update orders
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes, currentCount, priority } = updateOrderSchema.parse(body);

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
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

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {
      status,
      notes,
      priority,
      updatedAt: new Date(),
    };

    if (currentCount !== undefined) {
      updateData.currentCount = currentCount;
    }

    // Set timestamps based on status
    if (status === 'PROCESSING' && existingOrder.status === 'PENDING') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED' && existingOrder.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.currentCount = existingOrder.targetCount; // Set to target when completed
    } else if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const order = await prisma.$transaction(async (tx) => {
      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: updateData,
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

      // Create progress entry if count changed
      if (currentCount !== undefined && currentCount !== existingOrder.currentCount) {
        await tx.orderProgress.create({
          data: {
            orderId: params.id,
            count: currentCount,
            message: `Progress updated: ${currentCount}/${existingOrder.targetCount} members`,
          },
        });
      }

      // Create notification for status changes
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO';

      switch (status) {
        case 'PROCESSING':
          notificationTitle = 'Order Processing Started';
          notificationMessage = 'Your order is now being processed. You will receive updates as we add members to your group.';
          notificationType = 'INFO';
          break;
        case 'COMPLETED':
          notificationTitle = 'Order Completed Successfully!';
          notificationMessage = `Your order for ${existingOrder.targetCount.toLocaleString()} members has been completed successfully.`;
          notificationType = 'SUCCESS';
          break;
        case 'CANCELLED':
          notificationTitle = 'Order Cancelled';
          notificationMessage = 'Your order has been cancelled. If you have any questions, please contact support.';
          notificationType = 'WARNING';
          break;
        case 'FAILED':
          notificationTitle = 'Order Failed';
          notificationMessage = 'Unfortunately, your order could not be completed. Please contact support for assistance.';
          notificationType = 'ERROR';
          break;
      }

      if (notificationTitle) {
        await tx.notification.create({
          data: {
            userId: existingOrder.userId,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            actionUrl: `/dashboard/orders/${params.id}`,
          },
        });
      }

      return updatedOrder;
    });

    // Send email notification for completed orders
    if (status === 'COMPLETED' && existingOrder.status !== 'COMPLETED') {
      try {
        await sendEmail({
          to: order.user.email,
          subject: 'Order Completed - BoostGram AI',
          html: getOrderCompletedEmailTemplate(order.user.name || 'User', order),
        });
      } catch (emailError) {
        console.error('Failed to send completion email:', emailError);
      }
    }

    return NextResponse.json(order);
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

    // Only admins can delete orders
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await prisma.order.delete({
      where: { id: params.id },
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