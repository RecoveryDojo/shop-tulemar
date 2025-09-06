-- Set up cron job to run daily work analyzer at midnight every day
SELECT cron.schedule(
  'daily-work-analyzer',
  '0 0 * * *', -- Run at midnight (00:00) every day
  $$
  SELECT
    net.http_post(
        url:='https://whxmjebukensinfduber.supabase.co/functions/v1/daily-work-analyzer',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeG1qZWJ1a2Vuc2luZmR1YmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzAyOTUsImV4cCI6MjA3MTc0NjI5NX0.YSXTuTpaNvBQxPVNiH8433vHwQ6HSz1xO68XAH-VK38"}'::jsonb,
        body:='{"automated": true, "trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);