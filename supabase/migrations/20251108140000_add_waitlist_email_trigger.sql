-- Enable pg_net extension (provides net.http_post)
create extension if not exists pg_net schema extensions;

-- Function that calls the edge function after a new waitlist entry
create or replace function public.handle_waitlist_insert()
returns trigger as $$
declare
  response record;
  request_url text;
begin
  -- Expected to be set once with:
  --   alter database postgres set app.settings.waitlist_function_url = 'https://<project-ref>.supabase.co/functions/v1/send-waitlist-email';
  request_url := current_setting('app.settings.waitlist_function_url', true);

  if request_url is null then
    raise warning 'app.settings.waitlist_function_url is not set. Skipping email send.';
    return new;
  end if;

  select *
  from net.http_post(
    url := request_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'full_name', new.full_name,
      'email', new.email
    )
  ) into response;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger: ensure we have only one in place
drop trigger if exists on_join_waitlist on public.join_waitlist;

create trigger on_join_waitlist
  after insert on public.join_waitlist
  for each row
  execute function public.handle_waitlist_insert();



