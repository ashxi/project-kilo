#!/bin/bash
export URL=$PWD
cd ./tooling/usefulcommit
node index.js "$@"
cd $URL