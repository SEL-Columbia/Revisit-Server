set :upstart_file_contents, lambda {
<<EOD
#!upstart
description #{fetch(:application)}
author      "Sustainable Engineering Lab - Columbia University"

start on startup
stop on shutdown

script
    export HOME="/root"

    # Store the pid of this startup process so we can check if it's running later
    echo $$ > #{fetch(:upstart_pid_file_path)}

    exec sudo -u #{fetch(:user)} #{fetch(:node_bin_path)} #{fetch(:deploy_to)}/current/#{fetch(:server_init_file)} >> #{fetch(:upstart_log_path)} 2>&1
end script

pre-start script
    # Date format same as (new Date()).toISOString() for consistency
    echo "[`date -u +%Y-%m-%dT%T.%3NZ`] (sys) Starting" >> #{fetch(:upstart_log_path)}
end script

pre-stop script
	# Remove the pid of the startup process
    rm #{fetch(:upstart_pid_file_path)}

    echo "[`date -u +%Y-%m-%dT%T.%3NZ`] (sys) Stopping" >> #{fetch(:upstart_log_path)}
end script
EOD
}