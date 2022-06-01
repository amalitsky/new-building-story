#!/bin/bash
set -e
export TZ=Europe/London
dateStamp=`date +%Y%m%d`
unset TZ
mysqldump --defaults-extra-file=/data/backups/.db.cnf --add-drop-table --lock-tables --skip-add-locks --host=localhost --user=username db_name > /home/91597/data/backups/bcrawler/bcr_${dateStamp}_db.sql

gzip -f /data/backups/bcrawler/bcr_${dateStamp}_db.sql

find /data/backups/bcrawler/ -type f -mtime +30 -regextype posix-extended -not -regex '.*/bcr_20[0-9]{5}1_db\.sql\.gz' -exec rm -f {} \;
find /data/backups/bcrawler/ -type f -mtime +730 -exec rm -f {} \;
