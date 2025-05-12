-- Add indexes for better query performance

-- Index for polls table
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls (expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls (is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls (created_by);

-- Index for votes table
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes (user_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_index ON votes (option_index);

-- Combined index for vote counting
CREATE INDEX IF NOT EXISTS idx_votes_poll_option ON votes (poll_id, option_index);