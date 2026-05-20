# 第一阶段：依赖安装
# 单独安装依赖，利用 Docker 层缓存，只有 package.json 变更时才重新安装
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci

# 第二阶段：构建应用
# 将依赖从上一阶段复制进来，再执行 Next.js 生产构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 第三阶段：生产运行时镜像
# 只保留运行所需的产物，去掉源码和开发依赖，最小化镜像体积
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public* ./public/
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3001
ENV PORT=3001

CMD ["node", "server.js"]
