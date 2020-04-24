#!/bin/bash -l

printf "=======================================\n\n"
printf "Running Sector Scraper...\n\n"
# Load these for nvm and node.
source ~/.bashrc
source ~/.nvm/nvm.sh
source ~/.profile

# Navigate into the project directory.
cd ~/Git-Projects/Ameritrader-Bots/sector-scraper

# Use project's preferred node version from .nvmrf file.
nvm use

# source ~/.bashrc && cd ~/Git-Projects/Ameritrader-Bots/sector-scraper && nvm use && npm run derp

# Run the cron job!
npm run derp

