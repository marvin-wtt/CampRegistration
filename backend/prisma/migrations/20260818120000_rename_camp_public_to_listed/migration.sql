-- `public` only ever controlled whether a camp appears in the public directory,
-- never who may access it. Rename it to `listed` so the column says what it does.
ALTER TABLE `camps` RENAME COLUMN `public` TO `listed`;
