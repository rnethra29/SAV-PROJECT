-- ============================================================
-- 002: Helper functions (word-count check used by the BOQ 50-word rule)
-- ============================================================

CREATE OR REPLACE FUNCTION com_fn_word_count(p_text TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_text IS NULL OR trim(p_text) = '' THEN 0
              ELSE array_length(regexp_split_to_array(trim(p_text), '\s+'), 1)
         END;
$$;
