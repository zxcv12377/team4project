#!/bin/bash

# ===== 설정 =====
KEY_PATH=/home/soldesk/aws-RC2-key.pem
EC2_USER=ubuntu
EC2_HOST=3.37.124.155
BACKEND_JAR=./server/target/server-0.0.1-SNAPSHOT.jar
BACKEND_DIR=./server
FRONTEND_DIR=./frontend
FRONTEND_DIST=$FRONTEND_DIR/dist
REMOTE_DIR=/home/ubuntu/frontend

# ===== 빌드 실행 =====

echo "🔨 프론트엔드 빌드 중..."
(cd $FRONTEND_DIR && yarn install && yarn build)

# ===== EC2에 deploy 디렉토리 만들기 =====
echo "📦 EC2에 배포 디렉토리 생성 중..."
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST "mkdir -p $REMOTE_DIR"

# ===== 기존 프론트 엔드 dist 삭제 =====
echo "기존 dist 삭제"
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST "rm -rf /home/ubuntu/frontend/dist/*"

# ===== 프론트엔드 dist 복사 =====
echo "��️  프론트엔드 dist 복사 중..."
rsync -avz -e "ssh -i $KEY_PATH" $FRONTEND_DIST/ $EC2_USER@$EC2_HOST:$REMOTE_DIR/dist/ --rsync-path="sudo rsync"

echo "✅ 프론트 배포 완료!"
