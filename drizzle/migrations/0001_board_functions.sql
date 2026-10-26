-- Custom migration (drizzle-kit generate --custom): Postgres functions the game
-- calls through supabase.rpc(), same pattern as book_tee_time in the tee-times repo.

-- Picks p_size random full board columns (5 clues that aired together under one
-- category in one round of one show) with no repeated category names, and returns
-- every clue in those columns.
create or replace function public.random_board(p_round public.clue_round, p_size integer default 6)
returns setof public.clues
language sql
volatile
set search_path = public
as $$
  with full_columns as (
    select air_date, category
      from public.clues
     where round = p_round
     group by air_date, category
    having count(*) = 5
  ),
  one_per_category as (
    select distinct on (category) air_date, category
      from full_columns
     order by category, random()
  ),
  picked as (
    select air_date, category
      from one_per_category
     order by random()
     limit p_size
  )
  select c.*
    from public.clues c
    join picked p on p.air_date = c.air_date and p.category = c.category
   where c.round = p_round;
$$;
--> statement-breakpoint

create or replace function public.random_final_clue()
returns setof public.clues
language sql
volatile
set search_path = public
as $$
  select *
    from public.clues
   where round = 'Final Jeopardy!'
   order by random()
   limit 1;
$$;
--> statement-breakpoint

grant execute on function public.random_board(public.clue_round, integer) to anon, authenticated, service_role;
--> statement-breakpoint
grant execute on function public.random_final_clue() to anon, authenticated, service_role;
