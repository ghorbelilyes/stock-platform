#!/bin/bash
# Script to start the Angular app with Node 20

# Source nvm if it exists
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
elif [ -s "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
fi

# Use Node 20
nvm use 20

# Start the Angular app
npm start
