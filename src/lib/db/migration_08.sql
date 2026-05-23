-- Daily token usage aggregation function
CREATE OR REPLACE FUNCTION public.get_daily_token_usage(start_date TIMESTAMPTZ)
RETURNS TABLE(date DATE, total_tokens BIGINT, query_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DATE(created_at AT TIME ZONE 'Asia/Manila') AS date,
         COALESCE(SUM(tokens_used), 0)::BIGINT        AS total_tokens,
         COUNT(*)::BIGINT                            AS query_count
  FROM   public.chatbot_logs
  WHERE  created_at >= start_date
  GROUP  BY DATE(created_at AT TIME ZONE 'Asia/Manila')
  ORDER  BY date ASC;
$$;

-- Restrict execution to authenticated users and service role
REVOKE EXECUTE ON FUNCTION public.get_daily_token_usage(TIMESTAMPTZ) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_token_usage(TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_token_usage(TIMESTAMPTZ) TO service_role;

-- Index for session-based chatbot log retrieval
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_session_id ON public.chatbot_logs(session_id);
