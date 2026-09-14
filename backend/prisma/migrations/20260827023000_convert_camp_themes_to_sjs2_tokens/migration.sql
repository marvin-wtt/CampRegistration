-- Resets every event's saved SurveyJS theme to the default. This migration
-- originally converted stored themes from the deprecated `--sjs-*` CSS
-- variables to the `--sjs2-*` tokens introduced in SurveyJS v3, but that
-- conversion depended on a lossy compatibility shim and application code
-- (survey-core) to run. A plain reset gives every event the same known-good
-- baseline instead; anyone who had a custom theme can reapply it in the
-- Theme Editor.
UPDATE `events` SET `themes` = '{}';