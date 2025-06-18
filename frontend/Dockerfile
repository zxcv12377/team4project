# cla/Dockerfile
FROM node:20

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# serve static
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]