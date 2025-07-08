# 使用官方Node.js镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制Prisma schema
COPY prisma ./prisma/

# 生成Prisma client
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["npm", "start"] 