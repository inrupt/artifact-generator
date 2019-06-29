#!/bin/bash

rm -R generated/*
current_version=`npm view schema-ext version`
echo "The current version : $current_version"
node app.ts $current_version
cd generated
npm version patch
npm install
npm publish --registry http://localhost:4873
