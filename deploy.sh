#!/usr/bin/env sh

# 发生错误时终止
set -e

# 构建
cd app
npm run build

# 进入构建输出目录
cd dist

# 如果你要部署到自定义域名
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# 使用 HTTPS 方式推送到 gh-pages 分支
git push -f https://github.com/dangsq/MemoryTail.git main:gh-pages

cd -
