import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/utils';
import { createApiKeySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('API Keys GET error:', error);
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
    const { name, expiresAt } = createApiKeySchema.parse(body);

    // Check if user already has 5 API keys (limit)
    const existingKeys = await prisma.apiKey.count({
      where: { userId: session.user.id, isActive: true },
    });

    if (existingKeys >= 5) {
      return NextResponse.json(
        { error: 'Maximum number of API keys reached (5)' },
        { status: 400 }
      );
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name,
        key: generateApiKey(),
        expiresAt,
      },
    });

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    console.error('API Keys POST error:', error);
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
