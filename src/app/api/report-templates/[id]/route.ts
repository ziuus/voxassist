import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// PATCH: Update a template
export async function PATCH(req: NextRequest, context: any) {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const body = await req.json();
  const { name, fields, isDefault } = body;

  // If setting as default, unset other defaults for this user
  if (isDefault) {
    await supabase
      .from('report_templates')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)
      .neq('id', id);
  }

  const { data: template, error } = await supabase
    .from('report_templates')
    .update({ 
      name, 
      fields,
      is_default: isDefault !== undefined ? !!isDefault : undefined
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapSupabaseTemplate(template));
}

// DELETE: Delete a template
export async function DELETE(req: NextRequest, context: any) {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;

  const { error } = await supabase
    .from('report_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function mapSupabaseTemplate(raw: any) {
  return {
    id: raw.id,
    name: raw.name,
    fields: raw.fields,
    isDefault: raw.is_default,
    userId: raw.user_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
