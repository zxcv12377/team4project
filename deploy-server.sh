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
echo "🔨 백엔드 빌드 중..."
(cd server && ./mvnw clean package -DskipTests)

# ===== 백엔드 .jar 복사 =====
echo "🚀 백엔드 JAR 복사 중..."
rsync -avz -e "ssh -i $KEY_PATH" $BACKEND_JAR $EC2_USER@$EC2_HOST:$BACKEND_DIR/

echo "✅ 서버 배포 완료!"
