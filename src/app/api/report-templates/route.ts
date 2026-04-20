import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET: List all templates (optionally filter by user)
export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  const url = new URL(req.url);
  const onlyDefault = url.searchParams.get('default') === 'true';

  let query = supabase.from('report_templates').select('*');
  
  if (onlyDefault) {
    query = query.eq('is_default', true);
  } else if (userId) {
    // Supabase RLS handles the OR [own templates, global defaults] automatically
  } else {
    // Not logged in, only global defaults
    query = query.is('user_id', null).eq('is_default', true);
  }

  const { data: templates, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(templates.map(mapSupabaseTemplate));
}

// POST: Create a new template
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, fields, isDefault } = body;
  
  if (!name || !fields || !Array.isArray(fields)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // If setting as default, unset other defaults for this user
  if (isDefault) {
    await supabase
      .from('report_templates')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data: template, error } = await supabase
    .from('report_templates')
    .insert({
      user_id: userId,
      name,
      fields,
      is_default: !!isDefault,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapSupabaseTemplate(template));
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
