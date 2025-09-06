-- Schedule the daily-work-analyzer at midnight using pg_cron and pg_net
select
  cron.schedule(
    job_name := 'daily-work-analyzer',
    schedule := '0 0 * * *',
    command := $$
      select net.http_post(
        url := 'https://whxmjebukensinfduber.supabase.co/functions/v1/daily-work-analyzer',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.anon_key', true) || '"}'::jsonb,
        body := '{"automated": true, "trigger": "cron"}'::jsonb
      );
    $$
  );