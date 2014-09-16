# config valid only for Capistrano 3.1
lock '3.2.1'


set :application, "Revisit-Server"
set :repo_url, 'https://github.com/SEL-Columbia/Revisit-Server.git'

# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default deploy_to directory is /var/www/my_app
# set :deploy_to, '/var/www/my_app'

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

namespace :node do
    desc "Check required packages and install if packages are not installed"
    task :install_packages do
      run "mkdir -p #{previous_release}/node_modules ; cp -r #{previous_release}/node_modules #{release_path}" if previous_release
      run "cd #{release_path} && npm install --loglevel warn"
    end

    task :check_upstart_config do
      create_upstart_config if remote_file_differs?(upstart_file_path, upstart_file_contents)
    end

    desc "Create upstart script for this node app"
    task :create_upstart_config do
      temp_config_file_path = "#{shared_path}/#{application}.conf"

      # Generate and upload the upstart script
      put upstart_file_contents, temp_config_file_path

      # Copy the script into place and make executable
      sudo "cp #{temp_config_file_path} #{upstart_file_path}"
    end

    desc "Start the node application"
    task :start do
      sudo "start #{upstart_job_name}"
    end

    desc "Stop the node application"
    task :stop do
      sudo "stop #{upstart_job_name}"
    end

    desc "Restart the node application"
    task :restart do
      sudo "stop #{upstart_job_name}; true"
      sudo "start #{upstart_job_name}"
    end
  end


namespace :deploy do

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      # Your restart mechanism here, for example:
      # execute :touch, release_path.join('tmp/restart.txt')
    end
  end

  after :publishing, :restart

  after :restart, :clear_cache do
    on roles(:web), in: :groups, limit: 3, wait: 10 do
      # Here we can do anything such as:
      # within release_path do
      #   execute :rake, 'cache:clear'
      # end
    end
  end

end
