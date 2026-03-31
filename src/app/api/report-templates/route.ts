import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List all templates (optionally filter by user)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const onlyDefault = url.searchParams.get('default') === 'true';

  let where: any = {};
  if (onlyDefault) {
    where.isDefault = true;
  } else if (session?.user?.email) {
    // If user is logged in, show their templates and defaults
    where.OR = [{ userId: undefined }, { isDefault: true }];
  }

  const templates = await prisma.reportTemplate.findMany({ where });
  return NextResponse.json(templates);
}

// POST: Create a new template
export async function POST(req: NextRequest) {
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
