# SSL via [letsencrypt](https://letsencrypt.org/)

### Renewal
Letsencryt's certificates expire after 90 days. It's recommended that users automate the renewal process (in the future, auto-renewal might be a built-in feature of letsencrypt).

The `cli.ini` is an example config file for letsencrypt that could be used to facilitate auto-renewal. Assuming letsencrypt is installed on the server already, place this cli.ini file in `/etc/letsencrypt/`. Then to renew (or obtain for the first time) SSL certs from letsencrypt, stop the server, run letsencrypt, then start the server again.

```bash
$ service nginx stop
$ /path/to/letsencrypt/letsencrypt-auto --config /etc/letsencrypt/cli.ini -d staging.revisit.global certonly
$ service nginx start
```

In order to automate this, create a tiny shell script:

```bash
#!/bin/bash
#!/bin/bash

# stop nginx, otherwise renewal will fail
service nginx stop

# fetch the new cert
/path/to/letsencrypt/letsencrypt-auto --config /etc/letsencrypt/cli.ini -d staging.revisit.global certonly

# start nginx back up
service nginx start

# let someone know...
mail -s "SSL Renewal" admin@example.com <<< "The server's SSL has been renewed."
```

Then execute it monthly via cron:

```bash
$ sudo crontab -e

@monthly /path/to/renew-ssl.sh
```

**Note that we use the root user's crontab so that we can start/stop the server correctly**

### TODO
- check if letsencrypt is installed
- email status of attempt rather than a generic notification
