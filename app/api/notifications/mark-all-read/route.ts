import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}