FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/statisticsservice.jar app.jar

EXPOSE 8088

ENTRYPOINT ["java", "-jar", "app.jar"]