import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTelegramService } from '@/lib/telegram';
import { z } from 'zod';

const transferSchema = z.object({
  orderId: z.string(),
  sourceGroupLink: z.string().url(),
  targetGroupLink: z.string().url(),
  memberLimit: z.number().min(1).max(100000),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, sourceGroupLink, targetGroupLink, memberLimit } = transferSchema.parse(body);

    // Verify order belongs to user and is pending
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
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
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Create Telegram service instance
    const telegramService = createTelegramService({
      apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
      apiHash: process.env.TELEGRAM_API_HASH || '',
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      session: process.env.TELEGRAM_SESSION_STRING,
    });

    try {
      // Connect to Telegram
      const connected = await telegramService.connect();
      if (!connected) {
        throw new Error('Failed to connect to Telegram');
      }

      // Validate group access
      const [sourceValidation, targetValidation] = await Promise.all([
        telegramService.validateGroupAccess(sourceGroupLink),
        telegramService.validateGroupAccess(targetGroupLink),
      ]);

      if (!sourceValidation.canAccess) {
        throw new Error(`Cannot access source group: ${sourceValidation.error}`);
      }

      if (!targetValidation.canInvite) {
        throw new Error(`Cannot invite members to target group: ${targetValidation.error}`);
      }

      // Start transfer process
      const transferResult = await telegramService.transferMembers(
        sourceGroupLink,
        targetGroupLink,
        memberLimit,
        async (progress) => {
          // Update order progress in database
          await prisma.orderProgress.create({
            data: {
              orderId: orderId,
              count: progress.completed,
              message: `Transferred ${progress.completed}/${progress.total} members. Failed: ${progress.failed}`,
            },
          });

          // Update order current count
          await prisma.order.update({
            where: { id: orderId },
            data: { currentCount: progress.completed },
          });
        }
      );

      // Update final order status
      const finalStatus = transferResult.status === 'completed' ? 'COMPLETED' : 'FAILED';
      
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: finalStatus,
          currentCount: transferResult.completed,
          completedAt: finalStatus === 'COMPLETED' ? new Date() : null,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: finalStatus === 'COMPLETED' ? 'Transfer Completed!' : 'Transfer Failed',
          message: `Member transfer ${finalStatus.toLowerCase()}. Transferred: ${transferResult.completed}/${transferResult.total} members.`,
          type: finalStatus === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
          actionUrl: `/dashboard/orders/${orderId}`,
        },
      });

      // Disconnect from Telegram
      await telegramService.disconnect();

      return NextResponse.json({
        success: true,
        result: transferResult,
      });

    } catch (error) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'FAILED',
        },
      });

      // Create error notification
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Transfer Failed',
          message: `Member transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'ERROR',
          actionUrl: `/dashboard/orders/${orderId}`,
        },
      });

      // Always disconnect
      await telegramService.disconnect();

      throw error;
    }

  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Transfer failed',
        details: error instanceof Error ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

// Validate group endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupLink = searchParams.get('groupLink');

    if (!groupLink) {
      return NextResponse.json({ error: 'Group link is required' }, { status: 400 });
    }

    const telegramService = createTelegramService({
      apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
      apiHash: process.env.TELEGRAM_API_HASH || '',
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      session: process.env.TELEGRAM_SESSION_STRING,
    });

    try {
      const connected = await telegramService.connect();
      if (!connected) {
        throw new Error('Failed to connect to Telegram');
      }

      const [groupInfo, validation] = await Promise.all([
        telegramService.getGroupInfo(groupLink),
        telegramService.validateGroupAccess(groupLink),
      ]);

      await telegramService.disconnect();

      return NextResponse.json({
        groupInfo,
        validation,
      });

    } catch (error) {
      await telegramService.disconnect();
      throw error;
    }

  } catch (error) {
    console.error('Group validation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    );
  }
}
