# cla/Dockerfile
FROM node:20

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# serve static
RUN yarn global add serve
CMD ["serve", "-s", "build", "-l", "3000"]