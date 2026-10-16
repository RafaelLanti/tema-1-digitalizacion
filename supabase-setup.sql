-- Ejecuta este archivo completo en Supabase > SQL Editor.

create table if not exists public.leaderboard_players (
  player_id uuid primary key,
  name text not null check (char_length(name) between 3 and 18),
  score integer not null check (score between 0 and 10000),
  game text not null check (char_length(game) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leaderboard_players enable row level security;
grant select on public.leaderboard_players to anon, authenticated;

drop policy if exists "Clasificación visible públicamente" on public.leaderboard_players;
create policy "Clasificación visible públicamente"
on public.leaderboard_players for select
to anon, authenticated using (true);

create or replace function public.submit_score(
  p_player_id uuid,
  p_name text,
  p_score integer,
  p_game text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned_name text := btrim(p_name);
begin
  -- Los alias deben incluir al menos un número: "mesa" no se admite.
  if cleaned_name !~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{2,17}$'
     or cleaned_name !~ '[0-9]' then
    raise exception 'Alias no válido: usa letras y al menos un número (ejemplo Luna7).';
  end if;
  if p_score < 0 or p_score > 10000 then
    raise exception 'Puntuación no válida.';
  end if;
  if p_game is null or char_length(p_game) > 60 then
    raise exception 'Juego no válido.';
  end if;

  insert into public.leaderboard_players(player_id, name, score, game, updated_at)
  values (p_player_id, cleaned_name, p_score, p_game, now())
  on conflict (player_id) do update
    set name = excluded.name,
        score = excluded.score,
        game = excluded.game,
        updated_at = now()
    where excluded.score > public.leaderboard_players.score;
end;
$$;

revoke all on function public.submit_score(uuid, text, integer, text) from public;
grant execute on function public.submit_score(uuid, text, integer, text) to anon, authenticated;
