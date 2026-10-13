// Deploy: supabase functions deploy delete-account
// Deletes the caller's files, rows (cascade from auth.users) and auth user. Runs with the service role,
// so it only ever acts on the user identified by the caller's own JWT.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data, error } = await asUser.auth.getUser();
  if (error || !data.user) return new Response('Unauthorized', { status: 401, headers: cors });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const uid = data.user.id;

  // Storage is not covered by the table cascade: remove the user's folder first.
  const { data: files } = await admin.storage.from('garments').list(uid, { limit: 1000 });
  if (files?.length) await admin.storage.from('garments').remove(files.map((f) => `${uid}/${f.name}`));

  const { error: delErr } = await admin.auth.admin.deleteUser(uid); // cascades garments + outfits
  if (delErr) return new Response(delErr.message, { status: 500, headers: cors });

  return new Response(JSON.stringify({ deleted: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
