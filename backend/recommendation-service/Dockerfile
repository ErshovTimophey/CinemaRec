FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/recommendationservice.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]