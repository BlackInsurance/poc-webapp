#!/bin/sh


#CURRENT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURRENT_PATH=$(pwd)

mkdir -p ./prod/public

cd $CURRENT_PATH/backend
cp -r bin/ dist/ shared/ node_modules/ package.json server.js ../prod

cd $CURRENT_PATH/frontend
cp -r dist/* ../prod/public/

echo "####################################"
cat dist/index.html
echo "####################################"
PROD_FILE_COUNT=$(find ./dist -maxdepth 1 -type f -name '1.*.js' | wc -l)
if [ "$PROD_FILE_COUNT" -gt 0 ]; then
    TXT=$(cat dist/1.*.js)
    BIGTEST=$(cat dist/1.*.js | grep -b -o "6L" | awk 'BEGIN {FS=":"}{print $1}')
    echo ${TXT:BIGTEST:40}
else
    echo "NOT PROD"
fi
echo "####################################"




cd $CURRENT_PATH
rm -rf frontend
rm -rf backend



