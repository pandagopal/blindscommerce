-- Kill all sleeping connections to blindscommerce_test database
-- This helps clean up leaked connections

SELECT CONCAT('KILL ', id, ';') AS kill_command
FROM information_schema.processlist
WHERE db = 'blindscommerce_test'
AND command = 'Sleep'
AND time > 60;