-- Archive data (cities' photo clouds and their opened moments), so it can be edited in
-- Table Editor instead of living in the code. Safe to run again.
alter table public.baton_captures add column if not exists city text not null default 'la';
alter table public.baton_captures add column if not exists moment_photo text;
alter table public.baton_captures add column if not exists tilt real;
alter table public.baton_captures add column if not exists one_line boolean;
alter table public.baton_captures add column if not exists sort int;
alter table public.baton_captures add column if not exists seed_key text unique;
-- photo_path is the circle in the cloud and moment_photo the opened photo (empty: the same one).
-- Either is a path in the baton-capture-photos bucket, or a link, or a file in the app's public folder
-- such as /archive/la-cloud/21.jpg. Every photo opens when tapped; a note and question are optional.
-- Rows with a seed_key are the original archive; "Clear my saved captures" leaves them alone.
