FROM clojure:openjdk-17-tools-deps AS builder

WORKDIR /app

# Copy project files
COPY package.json package-lock.json ./
COPY shadow-cljs.edn ./
COPY deps.edn ./

# Install npm dependencies
RUN apt-get update && apt-get install -y nodejs npm
RUN npm install

# Copy source code
COPY resources ./resources
COPY src ./src

# Build ClojureScript
RUN npm run build

# Final stage
FROM nginx:alpine

COPY --from=builder /app/resources/public /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 