/*
  # Add company_size column to demo_requests table

  1. Alter Table
    - Add `company_size` column to `demo_requests` table
    - Type: text (nullable, optional field)
    - This column will store company size ranges like "1-10", "11-50", etc.
*/

-- Add company_size column to demo_requests table
ALTER TABLE demo_requests
ADD COLUMN IF NOT EXISTS company_size text;

-- Add comment to document the column
COMMENT ON COLUMN demo_requests.company_size IS 'Optional field for company size range (e.g., "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+")';

