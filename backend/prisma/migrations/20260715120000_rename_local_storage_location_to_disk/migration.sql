-- Rename the legacy `local` storage location to its canonical `disk` name.
UPDATE `files` SET `storage_location` = 'disk' WHERE `storage_location` = 'local';
