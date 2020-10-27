#!/bin/sh
git fetch --all
git reset --hard origin/master
yarn
yarn run docs:build
rm -rf /usr/share/nginx/html/file/docs
cp ./docs/.vuepress/dist /usr/share/nginx/html/file/docs