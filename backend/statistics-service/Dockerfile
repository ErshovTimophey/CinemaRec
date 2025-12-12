FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy the pre-built JAR file
# JAR is built automatically by docker-compose using mvnw before this stage
COPY target/statisticsservice.jar app.jar

EXPOSE 8088

ENTRYPOINT ["java", "-jar", "app.jar"]
