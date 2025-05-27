FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/reviewservice.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]