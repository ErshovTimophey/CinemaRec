FROM eclipse-temurin:17-jre

WORKDIR /app

# Копируем готовый JAR из target хоста
COPY target/authservice.jar ./app.jar

# Порт, на котором будет запущено приложение
EXPOSE 8081

CMD ["java", "-jar", "app.jar"]