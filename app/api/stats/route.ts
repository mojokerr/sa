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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    if (session.user.role === 'ADMIN') {
      // Admin stats
      const [
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        failedOrders,
        pausedOrders,
        totalUsers,
        activeUsers,
        totalMembers,
        totalRevenue,
        recentOrders,
        ordersByStatus,
        ordersByPriority,
        usersBySubscription,
        dailyStats,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'COMPLETED' } }),
        prisma.order.count({ where: { status: 'CANCELLED' } }),
        prisma.order.count({ where: { status: 'FAILED' } }),
        prisma.order.count({ where: { status: 'PAUSED' } }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.order.aggregate({
          _sum: { currentCount: true },
          where: { status: 'COMPLETED' },
        }),
        prisma.order.aggregate({
          _sum: { price: true },
          where: { paymentStatus: 'PAID' },
        }),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        }),
        prisma.order.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.order.groupBy({
          by: ['priority'],
          _count: { priority: true },
        }),
        prisma.user.groupBy({
          by: ['subscription'],
          _count: { subscription: true },
        }),
        prisma.order.groupBy({
          by: ['createdAt'],
          _count: { id: true },
          _sum: { price: true, currentCount: true },
          where: {
            createdAt: { gte: startDate },
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      return NextResponse.json({
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        failedOrders,
        pausedOrders,
        totalUsers,
        activeUsers,
        totalMembers: totalMembers._sum.currentCount || 0,
        totalRevenue: totalRevenue._sum.price || 0,
        recentOrders,
        ordersByStatus,
        ordersByPriority,
        usersBySubscription,
        dailyStats,
      });
    } else {
      // User stats
      const [
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        totalMembers,
        totalSpent,
        recentOrders,
        monthlyStats,
      ] = await Promise.all([
        prisma.order.count({ where: { userId: session.user.id } }),
        prisma.order.count({ 
          where: { userId: session.user.id, status: 'PENDING' } 
        }),
        prisma.order.count({ 
          where: { userId: session.user.id, status: 'PROCESSING' } 
        }),
        prisma.order.count({ 
          where: { userId: session.user.id, status: 'COMPLETED' } 
        }),
        prisma.order.count({ 
          where: { userId: session.user.id, status: 'CANCELLED' } 
        }),
        prisma.order.aggregate({
          _sum: { currentCount: true },
          where: { userId: session.user.id, status: 'COMPLETED' },
        }),
        prisma.order.aggregate({
          _sum: { price: true },
          where: { userId: session.user.id, paymentStatus: 'PAID' },
        }),
        prisma.order.findMany({
          where: { userId: session.user.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.groupBy({
          by: ['createdAt'],
          _count: { id: true },
          _sum: { currentCount: true },
          where: {
            userId: session.user.id,
            createdAt: { gte: startDate },
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      return NextResponse.json({
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        totalMembers: totalMembers._sum.currentCount || 0,
        totalSpent: totalSpent._sum.price || 0,
        recentOrders,
        monthlyStats,
      });
    }
  } catch (error) {
    console.error('Stats GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}