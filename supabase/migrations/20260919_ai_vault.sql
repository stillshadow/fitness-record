create extension if not exists supabase_vault with schema vault;

create table if not exists public.user_ai_secret_refs (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  secret_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.user_ai_secret_refs enable row level security;
revoke all on public.user_ai_secret_refs from anon, authenticated;

create or replace function public.ai_provider_secret_exists(
  p_user_id uuid,
  p_provider text
)
returns boolean
language sql
security definer
set search_path = public, vault
as $$
  select exists(
    select 1
    from public.user_ai_secret_refs r
    join vault.secrets s on s.id = r.secret_id
    where r.user_id = p_user_id
      and r.provider = p_provider
  );
$$;

create or replace function public.get_ai_provider_secret(
  p_user_id uuid,
  p_provider text
)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select d.decrypted_secret
  from public.user_ai_secret_refs r
  join vault.decrypted_secrets d on d.id = r.secret_id
  where r.user_id = p_user_id
    and r.provider = p_provider
  limit 1;
$$;

create or replace function public.set_ai_provider_secret(
  p_user_id uuid,
  p_provider text,
  p_secret text
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
  v_name text;
begin
  if p_secret is null or length(trim(p_secret)) < 8 then
    raise exception 'API key is too short';
  end if;

  select secret_id
    into v_secret_id
  from public.user_ai_secret_refs
  where user_id = p_user_id
    and provider = p_provider;

  if v_secret_id is not null then
    perform vault.update_secret(
      v_secret_id,
      p_secret,
      null,
      'User API key for ' || p_provider
    );
  else
    v_name := 'fitness_ai_' || p_provider || '_' || replace(p_user_id::text, '-', '');
    select vault.create_secret(
      p_secret,
      v_name,
      'User API key for fitness app'
    ) into v_secret_id;

    insert into public.user_ai_secret_refs(user_id, provider, secret_id)
    values (p_user_id, p_provider, v_secret_id)
    on conflict (user_id, provider)
    do update set secret_id = excluded.secret_id, updated_at = now();
  end if;

  update public.user_ai_secret_refs
  set updated_at = now()
  where user_id = p_user_id
    and provider = p_provider;
end;
$$;

create or replace function public.delete_ai_provider_secret(
  p_user_id uuid,
  p_provider text
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  select secret_id
    into v_secret_id
  from public.user_ai_secret_refs
  where user_id = p_user_id
    and provider = p_provider;

  delete from public.user_ai_secret_refs
  where user_id = p_user_id
    and provider = p_provider;

  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;
end;
$$;

revoke all on function public.ai_provider_secret_exists(uuid, text) from public, anon, authenticated;
revoke all on function public.get_ai_provider_secret(uuid, text) from public, anon, authenticated;
revoke all on function public.set_ai_provider_secret(uuid, text, text) from public, anon, authenticated;
revoke all on function public.delete_ai_provider_secret(uuid, text) from public, anon, authenticated;

grant execute on function public.ai_provider_secret_exists(uuid, text) to service_role;
grant execute on function public.get_ai_provider_secret(uuid, text) to service_role;
grant execute on function public.set_ai_provider_secret(uuid, text, text) to service_role;
grant execute on function public.delete_ai_provider_secret(uuid, text) to service_role;
