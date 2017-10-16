#!/bin/zsh

ng build --prod --aot
cp ./deploy.cmd dist/
cp ./.deployment dist/
cd dist
git init
git add --all
git commit -m "update build"
URL=$(az webapp deployment source config-local-git --name litoziekla-reserveer --slot staging --resource-group Litoziekla --query url --output tsv)
git remote add azure $URL
git push --force azure master
cd ..
