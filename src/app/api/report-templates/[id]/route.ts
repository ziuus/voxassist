import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH: Update a template
export async function PATCH(req: NextRequest, context: any) {
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
  const { id } = context.params;
  const body = await req.json();
  const { name, fields } = body;
  const template = await prisma.reportTemplate.update({
    where: { id },
    data: { name, fields },
  });
  return NextResponse.json(template);
}

// DELETE: Delete a template
export async function DELETE(req: NextRequest, context: any) {
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
  const { id } = context.params;
  await prisma.reportTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
