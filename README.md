# Tema 1 · Digitalización — Web para GitHub Pages

Web estática multipágina basada en el Tema 1 del PDF aportado: **“Digitalización. Creación de entornos IT y OT”**.

## Archivos
- `index.html`: portada y mapa del tema.
- `digitalizacion.html`: definición, motivos, aplicaciones y cambios empresariales.
- `it-ot.html`: tecnologías IT/OT, departamentos y herramientas.
- `evolucion.html`: evolución IT-OT, beneficios, riesgos y caso Repsol.
- `actividades.html`: actividades de repaso y aplicación.
- `reto.html`: reto profesional de la papelería “Tu Rincón”.
- `styles.css`: diseño responsive.
- `app.js`: menú móvil, modo oscuro y búsqueda local.

## Publicarlo en GitHub Pages
1. Crea un repositorio en GitHub.
2. Sube todos los archivos de esta carpeta a la raíz del repositorio.
3. Ve a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama principal y la carpeta `/ (root)`.
6. Guarda y espera a que GitHub publique la web.

No necesita servidor ni framework: funciona como HTML/CSS/JS estático.


## Juegos educativos y clasificación global Top 20

Se ha añadido `juegos.html` con tres juegos:
- **Quiz de digitalización**: preguntas tipo test.
- **¿IT, OT o ambas?**: clasifica tecnologías y herramientas.
- **Reto relámpago**: verdadero/falso con 45 segundos.

La clasificación muestra los **20 mejores jugadores**, compartidos entre móviles y ordenadores cuando Supabase está configurado. Se conserva el mejor resultado de cada navegador/perfil para que una persona no ocupe varias posiciones con cada partida. Cada navegador recibe un identificador aleatorio guardado en su almacenamiento local.

### Activar el Top 20 global con Supabase

GitHub Pages solo sirve archivos estáticos; no proporciona una base de datos. Para que los resultados de 20 o más personas se compartan entre dispositivos, hace falta una base de datos externa. Esta web usa Supabase.

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Abre **SQL Editor** y ejecuta el SQL completo siguiente. Crea una tabla independiente para la clasificación nueva y una función que guarda el mejor resultado de cada jugador:

```sql
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
```

3. Ve a **Project Settings → API** (o **Connect**) y copia la **Project URL** y la clave pública **anon/publishable** compatible con la API REST.
4. Abre `supabase-config.js` y reemplaza `https://TU_PROYECTO.supabase.co` y `TU_CLAVE_ANON_PUBLICA` por tus valores.
5. Sube todos los archivos de esta carpeta al repositorio de GitHub y espera a que GitHub Pages vuelva a publicar la web.
6. Prueba con dos navegadores o dos móviles. Guarda una puntuación en uno y pulsa **Actualizar clasificación** en el otro: debería aparecer en el mismo Top 20.

### Restricción de alias

No se admiten nombres formados solo por una palabra, como `mesa`: los alias deben tener entre 3 y 18 caracteres, empezar por una letra y contener al menos un número, por ejemplo `Luna7` o `Equipo_12`. La regla se comprueba en el navegador y también en la función de base de datos. Así se bloquean las palabras sueltas; no es un detector lingüístico que pueda reconocer todas las palabras posibles si se camuflan dentro de un alias más largo.

### Límites y seguridad

- Nunca pongas una clave `service_role` en una web pública. Usa únicamente la clave pública de Supabase.
- Si no configuras Supabase, los juegos siguen funcionando, pero la clasificación solo se guarda en el navegador y no se comparte.
- La función evita que se envíen alias sin número y guarda solo el mejor resultado por identificador de jugador. Sin embargo, como el juego se ejecuta en el navegador, alguien con conocimientos técnicos podría intentar falsificar puntuaciones. Para una competición de alto riesgo haría falta un backend que valide las partidas.
- El identificador del jugador se guarda en el almacenamiento local del navegador. Si se borra ese almacenamiento o se cambia de navegador/dispositivo, se creará una identidad nueva.

## Publicar en GitHub Pages

Mantén todos los archivos en la raíz del repositorio y activa **Settings → Pages → Deploy from a branch → rama principal → /(root)**. `index.html` es la portada. No se necesita instalar un framework.
