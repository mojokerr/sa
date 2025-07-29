import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Check if API key belongs to user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('API Key DELETE error:', error);
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
    const { isActive } = body;

    // Check if API key belongs to user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(updatedApiKey);
  } catch (error) {
    console.error('API Key PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
