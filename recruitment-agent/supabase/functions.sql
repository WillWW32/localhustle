-- Helper functions for atomic counter updates

CREATE OR REPLACE FUNCTION increment_daily_emails(p_campaign_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_log (campaign_id, date, emails_sent)
  VALUES (p_campaign_id, p_date, 1)
  ON CONFLICT (campaign_id, date)
  DO UPDATE SET emails_sent = daily_log.emails_sent + 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_daily_dms(p_campaign_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_log (campaign_id, date, dms_sent)
  VALUES (p_campaign_id, p_date, 1)
  ON CONFLICT (campaign_id, date)
  DO UPDATE SET dms_sent = daily_log.dms_sent + 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_campaign_emails(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET total_emails_sent = total_emails_sent + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_campaign_dms(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET total_dms_sent = total_dms_sent + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_campaign_responses(p_campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET total_responses = total_responses + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;
