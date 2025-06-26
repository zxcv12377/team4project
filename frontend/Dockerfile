# cla/Dockerfile
FROM node:20

WORKDIR /app

# 종속성 정의만 복사
COPY package.json yarn.lock ./

# 정리 후 install (optionalDependencies 포함)
RUN yarn install --frozen-lockfile

# 전체 소스 복사
COPY . .

# 빌드
RUN yarn build

# serve static
RUN yarn global add serve
CMD ["serve", "-s", "build", "-l", "3000"]