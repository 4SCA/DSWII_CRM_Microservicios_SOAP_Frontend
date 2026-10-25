# Etapa 1: construir la aplicación React + Vite
FROM node:22-alpine AS build

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Generar la carpeta dist
RUN npm run build

# Etapa 2: servir la aplicación con Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]