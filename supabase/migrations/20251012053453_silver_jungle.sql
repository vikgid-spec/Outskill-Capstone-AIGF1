/*
  # Create users table for authentication

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (varchar, not null)
      - `username` (varchar, unique, not null)
      - `email` (varchar, unique, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for user registration and profile access
*/

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant base permissions to anonymous users for registration
GRANT SELECT, INSERT ON users TO anon;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for anonymous users to insert during registration
CREATE POLICY "Allow anonymous registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy for checking username availability (anonymous can check)
CREATE POLICY "Allow username availability check"
  ON users
  FOR SELECT
  TO anon
  USING (true);