#!/bin/sh


CURRENT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

mkdir -p ./prod/public

cd $CURRENT_PATH/backend
cp -r bin/ dist/ shared/ node_modules/ package.json ../prod

cd $CURRENT_PATH/frontend
cp -r dist/* ../prod/public/

cd $CURRENT_PATH
rm -rf frontend
rm -rf backend



