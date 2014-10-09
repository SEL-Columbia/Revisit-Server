#!/bin/sh
cd /var/db_snapshots/
FILE=dump_$(date "+%Y%d%m_%H%M%S")
FILETAR="$FILE.tar.gz"

# The mongo user performing the backup needs the 'backup' and 'dbAdminAnyDatabase' roles on the admin db.
mongodump -u [BACKUP_USER] -p [BACKUP_USER_PASS] -o "$FILE"
tar -zcf "$FILETAR" "$FILE"
rm -rf $FILE

# remove snapshots older than 30 days
find *.tar.gz -mtime +30 -exec rm {} \;