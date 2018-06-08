md prod\public
xcopy frontend\dist prod\public /E /Y

md prod\bin
xcopy backend\bin prod\bin /E /Y

md prod\dist
xcopy backend\dist prod\dist /E /Y

md prod\shared
xcopy backend\shared prod\shared /E /Y

md prod\node_modules
xcopy backend\node_modules prod\node_modules /E /Y

copy backend\package.json prod\

copy backend\server.js prod\

rmdir /S /Q backend
rmdir /S /Q frontend