#!/bin/sh
git fetch --all
git reset --hard origin/master
yarn
yarn run docs:build
mv ./docs/.vuepress/dist /usr/share/nginx/html/file/docs