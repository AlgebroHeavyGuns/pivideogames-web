@echo off

bundle install
bundle exec jekyll serve --trace --config _config.yml --host "127.0.0.1" --port "4000"