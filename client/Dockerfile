FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package.json ./
COPY client/package.json ./client/

# Install dependencies
RUN npm install && npm install --prefix client

# Copy source code
COPY client/ ./client/

# Build React app with API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

WORKDIR /app/client
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/client/build /usr/share/nginx/html

# Copy nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


