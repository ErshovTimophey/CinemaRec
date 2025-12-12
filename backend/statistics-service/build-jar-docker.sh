#!/bin/bash
# Script to build JAR using Docker (works on Windows with Git Bash or WSL)

echo "Building JAR using Docker..."

# Build common-dto using Docker
echo "Building common-dto..."
docker run --rm \
  -v "%cd%/../common-dto:/app" \
  -w /app \
  maven:3.9-eclipse-temurin-17 \
  mvn clean install -DskipTests

if [ $? -ne 0 ]; then
  echo "Failed to build common-dto"
  exit 1
fi

# Build statistics-service using Docker
echo "Building statistics-service..."
docker run --rm \
  -v "%cd%/../common-dto:/root/.m2/repository/com/example/common-dto/1.0-SNAPSHOT" \
  -v "%cd%:/app" \
  -w /app \
  maven:3.9-eclipse-temurin-17 \
  mvn clean package -DskipTests

if [ $? -eq 0 ]; then
  echo "SUCCESS! JAR built: target/statisticsservice.jar"
else
  echo "Failed to build statistics-service"
  exit 1
fi
