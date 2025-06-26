# cla/Dockerfile
FROM node:20

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# serve static
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]