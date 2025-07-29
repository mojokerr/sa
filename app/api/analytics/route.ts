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
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    const days = parseInt(timeRange.replace('d', '').replace('y', '')) || 30;
    const startDate = new Date(now);
    
    if (timeRange.includes('y')) {
      startDate.setFullYear(now.getFullYear() - days);
    } else {
      startDate.setDate(now.getDate() - days);
    }

    // Build where clause based on user role
    const whereClause = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
      ? { createdAt: { gte: startDate } }
      : { userId: session.user.id, createdAt: { gte: startDate } };

    // Get basic stats
    const [
      totalOrders,
      completedOrders,
      processingOrders,
      failedOrders,
      cancelledOrders,
      totalRevenue,
      totalMembers,
      ordersThisMonth,
      membersThisMonth
    ] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.count({ where: { ...whereClause, status: 'COMPLETED' } }),
      prisma.order.count({ where: { ...whereClause, status: 'PROCESSING' } }),
      prisma.order.count({ where: { ...whereClause, status: 'FAILED' } }),
      prisma.order.count({ where: { ...whereClause, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { ...whereClause, status: 'COMPLETED' },
        _sum: { price: true }
      }),
      prisma.order.aggregate({
        where: { ...whereClause, status: 'COMPLETED' },
        _sum: { currentCount: true }
      }),
      prisma.order.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          ...whereClause,
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        },
        _sum: { currentCount: true }
      })
    ]);

    // Calculate success rate
    const successRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calculate average completion time
    const completedOrdersWithTime = await prisma.order.findMany({
      where: {
        ...whereClause,
        status: 'COMPLETED',
        startedAt: { not: null },
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      }
    });

    const avgCompletionTime = completedOrdersWithTime.length > 0
      ? completedOrdersWithTime.reduce((acc, order) => {
          const diff = new Date(order.completedAt!).getTime() - new Date(order.startedAt!).getTime();
          return acc + (diff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / completedOrdersWithTime.length
      : 0;

    // Get daily data for charts
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayOrders = await prisma.order.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      const dayMembers = await prisma.order.aggregate({
        where: {
          ...whereClause,
          status: 'COMPLETED',
          createdAt: {
            gte: date,
            lt: nextDate
          }
        },
        _sum: { currentCount: true }
      });

      const dayRevenue = await prisma.order.aggregate({
        where: {
          ...whereClause,
          status: 'COMPLETED',
          createdAt: {
            gte: date,
            lt: nextDate
          }
        },
        _sum: { price: true }
      });

      dailyData.push({
        date: date.toISOString().split('T')[0],
        orders: dayOrders,
        members: dayMembers._sum.currentCount || 0,
        revenue: dayRevenue._sum.price || 0
      });
    }

    // Status distribution
    const statusDistribution = [
      { name: 'مكتملة', value: completedOrders, color: '#10b981' },
      { name: 'قيد المعالجة', value: processingOrders, color: '#3b82f6' },
      { name: 'فاشلة', value: failedOrders, color: '#ef4444' },
      { name: 'ملغية', value: cancelledOrders, color: '#6b7280' }
    ].filter(item => item.value > 0);

    // Priority distribution
    const priorityStats = await prisma.order.groupBy({
      by: ['priority'],
      where: whereClause,
      _count: true
    });

    const priorityColors = {
      'LOW': '#6b7280',
      'NORMAL': '#3b82f6',
      'HIGH': '#f59e0b',
      'URGENT': '#ef4444'
    };

    const priorityDistribution = priorityStats.map(stat => ({
      name: stat.priority,
      value: stat._count,
      color: priorityColors[stat.priority as keyof typeof priorityColors]
    }));

    // Top groups
    const topGroups = await prisma.order.groupBy({
      by: ['groupLink'],
      where: whereClause,
      _count: true,
      _sum: { currentCount: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 5
    });

    const topGroupsFormatted = topGroups.map(group => ({
      groupLink: group.groupLink,
      orders: group._count,
      totalMembers: group._sum.currentCount || 0
    }));

    // Recent activity
    const recentOrders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        targetCount: true,
        currentCount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const recentActivity = recentOrders.map(order => ({
      id: order.id,
      type: 'order',
      description: `طلب ${order.status === 'COMPLETED' ? 'مكتمل' : order.status === 'PROCESSING' ? 'قيد المعالجة' : 'جديد'} - ${order.currentCount}/${order.targetCount} عضو`,
      timestamp: order.updatedAt.toISOString()
    }));

    const analyticsData = {
      totalOrders,
      completedOrders,
      totalMembers: totalMembers._sum.currentCount || 0,
      totalRevenue: totalRevenue._sum.price || 0,
      successRate,
      avgCompletionTime,
      ordersThisMonth,
      membersThisMonth: membersThisMonth._sum.currentCount || 0,
      chartData: {
        daily: dailyData,
        monthly: [], // Could implement monthly aggregation
        statusDistribution,
        priorityDistribution
      },
      topGroups: topGroupsFormatted,
      recentActivity
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
