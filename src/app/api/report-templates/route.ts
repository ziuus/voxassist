import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List all templates (optionally filter by user)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const url = new URL(req.url);
  const onlyDefault = url.searchParams.get('default') === 'true';

  let where: any = {};
  if (onlyDefault) {
    where.isDefault = true;
  } else if (userId) {
    where.OR = [{ userId }, { isDefault: true }];
  }

  const templates = await prisma.reportTemplate.findMany({ where });
  return NextResponse.json(templates);
}

// POST: Create a new template
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { name, fields, isDefault } = body;
  if (!name || !fields || !Array.isArray(fields)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const template = await prisma.reportTemplate.create({
    data: {
      userId: isDefault ? undefined : session.user.id,
      name,
      fields,
      isDefault: !!isDefault,
    },
  });
  return NextResponse.json(template);
}
