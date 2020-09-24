#!/bin/bash -l

# Print some nice things in the logs.
printf "=======================================\n\n"
printf "Running Triple Gainer Notifier...\n"
printf "$(date)\n\n"

# Load these for nvm and node.
source ~/.bashrc
source ~/.nvm/nvm.sh
source ~/.profile

# Navigate into the project directory.
cd ~/Git-Projects/Ameritrader-Bots/tg-notifier

# Use project's preferred node version from .nvmrc file.
nvm use

# Run the cron job!
npm start

printf "\nTriple Gainer Notifier cronjob has completed!\n"
