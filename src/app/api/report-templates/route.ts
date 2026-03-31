import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List all templates (optionally filter by user)
export async function GET(req: NextRequest) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  const url = new URL(req.url);
  const onlyDefault = url.searchParams.get('default') === 'true';

  let where: any = {};
  if (onlyDefault) {
    where.isDefault = true;
  } else {
    // Show all templates if not filtering by default
    // (You can add user-based filtering here if needed)
  }

  const templates = await prisma.reportTemplate.findMany({ where });
  return NextResponse.json(templates);
}

// POST: Create a new template
export async function POST(req: NextRequest) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name, fields, isDefault } = body;
  if (!name || !fields || !Array.isArray(fields)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const template = await prisma.reportTemplate.create({
    data: {
      // userId is not set since we don't have id, only email
      name,
      fields,
      isDefault: !!isDefault,
    },
  });
  return NextResponse.json(template);
}
