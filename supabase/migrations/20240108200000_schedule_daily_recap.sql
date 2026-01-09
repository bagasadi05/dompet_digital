-- Enable extensions
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule the job to run every day at 8 PM (20:00)
-- Note: Replace 'http://edge-runtime:8081' with your actual Edge Function URL. 
-- In production Supabase, this is usually 'https://<project-ref>.supabase.co/functions/v1/telegram-bot'
-- In local dev, it is often 'http://host.docker.internal:54321/functions/v1/telegram-bot' or similar.

-- For safety, we use a generic placeholder that the user must update or environment variable substitution if supported.
-- Here we assume standard local development URL for Supabase CLI:

select
  cron.schedule(
    'daily-recap',
    '0 20 * * *', -- At 20:00 every day
    $$
    select
      net.http_post(
          url:='http://edge-runtime:8081/functions/v1/telegram-bot',
          headers:='{"Content-Type": "application/json"}',
          body:='{"type": "daily_recap"}'
      ) as request_id;
    $$
  );
