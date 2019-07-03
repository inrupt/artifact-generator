#!/bin/bash

cd generated
npm install
npm publish --registry http://localhost:4873
