/*
  # Fix RLS policies for Hawa_Consignee table

  1. Enable RLS on Hawa_Consignee table
  2. Grant permissions to anonymous users
  3. Create policy to allow public access for testing purposes
*/

-- Enable Row Level Security on Hawa_Consignee table
ALTER TABLE Hawa_Consignee ENABLE ROW LEVEL SECURITY;

-- Grant base permissions to anonymous users
GRANT SELECT, INSERT ON Hawa_Consignee TO anon;

-- For testing purposes, allow public access to Hawa_Consignee
CREATE POLICY "Allow public access to Hawa_Consignee"
  ON Hawa_Consignee
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
