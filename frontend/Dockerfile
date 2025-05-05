# Используем базовый образ Node.js
FROM node:16

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

RUN npm install --legacy-peer-deps
# Копируем исходный код
COPY . .


# Собираем приложение
RUN npm run build

# Указываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]