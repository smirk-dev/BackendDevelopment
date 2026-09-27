-- run from inside psql with \i to show script execution
SELECT 'run from a .sql file with \i' AS message, current_database(), current_user, now()::date AS today;
