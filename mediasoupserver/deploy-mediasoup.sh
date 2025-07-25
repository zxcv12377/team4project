#!/bin/bash

KEY=~/aws-RC2-key.pem
EC2=ubuntu@3.37.124.155
SRC=.
DEST=/home/ubuntu/mediasoupserver

echo "🚀 mediasoup 서버 배포 중 (node_modules 제외)..."

rsync -avz \
  --exclude node_modules \
  --exclude .git \
  -e "ssh -i $KEY" \
  $SRC/ $EC2:$DEST/

echo "✅ 복사 완료. EC2에서 다음 명령 실행:"
echo "ssh -i $KEY $EC2"
echo "cd $DEST && npm install && node dist/index.js"
