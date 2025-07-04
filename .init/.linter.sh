#!/bin/bash
cd /home/kavia/workspace/code-generation/notenest-104986-482eb96f/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

