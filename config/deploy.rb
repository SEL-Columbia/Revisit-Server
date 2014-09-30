# config valid only for Capistrano 3.2.1
lock '3.2.1'


set :application, "revisit-server"
set :repo_url, 'https://github.com/SEL-Columbia/Revisit-Server.git'

set :server_init_file, 'revisit-daemon.js'

set :upstart_job_name, 'revisit'
set :upstart_conf_file_path, "/etc/init/#{fetch(:upstart_job_name)}.conf"
set :upstart_pid_file_path, "/var/run/#{fetch(:upstart_job_name)}.pid"

set :node_bin_path, '/usr/bin/node'

set :npm_roles, :web

# load in upstart config content
require_relative "upstart-config.rb"

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for keep_releases is 5
# set :keep_releases, 5

namespace :setup do

  desc "Check remote server settings"
  task :servercheck do
    on roles(:all) do |h|

      info "-------------------------"
      info "-- DEPLOY WRITE ACCESS --"
      info "-------------------------"

      info "Checking write access..."
      if test("[ -w #{fetch(:deploy_to)} ]")
        info "#{fetch(:deploy_to)} is writable on #{h}"
      else
        error "#{fetch(:deploy_to)} is not writable on #{h}"
      end

      info "------------------"
      info "-- DEPENDENCIES --"
      info "------------------"

      info "Checking if bunyan is installed globally for logging..."
      if test("bunyan --version")
        info "bunyan is available on #{h}"
      else
        error "bunyan is not available on #{h}"
      end

      info "---------------"
      info "-- LOG FILES --"
      info "---------------"

      info "Checking if access log file is present..."
      if test("[ -f /var/log/#{fetch(:application)}/#{fetch(:application)}-access.log ]")
        info "Access log is present."
      else
        error "Access log not found, attempting to create it..."
        execute :sudo, "mkdir -p /var/log/#{fetch(:application)}"
        execute :sudo, "touch /var/log/#{fetch(:application)}/#{fetch(:application)}-access.log"
        execute :sudo, "chown web:web /var/log/#{fetch(:application)}/#{fetch(:application)}-access.log"
      end

      info "Checking if error log file is present..."
      if test("[ -f /var/log/#{fetch(:application)}/#{fetch(:application)}-error.log ]")
        info "Error log is present."
      else
        error "Error log not found, attempting to create it..."
        execute :sudo, "mkdir -p /var/log/#{fetch(:application)}"
        execute :sudo, "touch /var/log/#{fetch(:application)}/#{fetch(:application)}-error.log"
        execute :sudo, "chown web:web /var/log/#{fetch(:application)}/#{fetch(:application)}-error.log"
      end
    end
  end

end


namespace :node do

    desc "Check if the upstart config is present on the server. If not, generate it."
    task :check_upstart_config do
      on roles(:web) do
        if test("[ -f #{fetch(:upstart_conf_file_path)} ]")
          info "Upstart configuration exists on server."
        else
          error "Upstart configuration not present, attempting to create."
          invoke 'node:create_upstart_config'
        end
      end
    end


    desc "Create and upload upstart script for this node app"
    task :create_upstart_config do
      tmp_upstart_config_path = "config/#{fetch(:upstart_job_name)}.conf"
      run_locally do
        open(tmp_upstart_config_path, 'w') do |f|
          f.puts "#{fetch(:upstart_file_contents)}" 
        end
      end

      on roles(:app) do
        # we upload to tmp and then move to the correct location in order to deal with permissions during upload
        upload! tmp_upstart_config_path, "/tmp/revisit.conf"
        execute :sudo, "cp /tmp/revisit.conf #{fetch(:upstart_conf_file_path)}"
      end
    end


    desc "Start the node application"
    task :start do
      on roles(:app) do
        if !test("[ -f #{fetch(:upstart_pid_file_path)} ]")
          execute :sudo, "start #{fetch(:upstart_job_name)}"
        else
          error " -- NOT STARTED -- Node server already appears to be running."
        end
      end
    end


    desc "Stop the node application"
    task :stop do
      on roles(:app) do
        if test("[ -f #{fetch(:upstart_pid_file_path)} ]")
          execute :sudo, "stop #{fetch(:upstart_job_name)}"
        else
          error " -- NOT STOPPED -- Node server does not appear to be running."
        end
      end
    end


    desc "Restart the node application"
    task :restart do
      on roles(:app) do
        invoke 'node:stop'
        invoke 'node:start'
      end
    end
  end




namespace :deploy do

  # desc 'Restart application server (using upstart job) - this happens for both deployment and rollback.'
  task :restart do
    invoke 'node:restart'
  end
  

end


before 'deploy', 'setup:servercheck'

# After the app is published, restart the server
after 'deploy:published', 'deploy:restart'

# Before restarting the server, make sure the upstart config is present
before 'deploy:restart', 'node:check_upstart_config'
