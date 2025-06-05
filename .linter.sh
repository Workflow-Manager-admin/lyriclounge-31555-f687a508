#!/bin/bash
cd /home/kavia/workspace/code-generation/lyriclounge-31555-f687a508/lyriclounge_main
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

