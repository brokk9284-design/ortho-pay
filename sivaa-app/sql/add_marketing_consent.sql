-- Add marketing_consent column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketing_consent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketing_consent boolean DEFAULT true;
  END IF;
END $$;
