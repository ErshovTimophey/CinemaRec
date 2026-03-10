# gRPC в CinemaRec

## Реализовано: межсервисное общение по gRPC

Микросервисы общаются между собой по **gRPC** (Feign/REST между сервисами убраны).

### 1. user-service ↔ recommendation-service

- **api-grpc:** `recommendation.proto` — `RecommendationService.GetRecommendations`.
- **recommendation-service:** gRPC-сервер на порту **9093**, `RecommendationGrpcServiceImpl`.
- **user-service:** gRPC-клиент `@GrpcClient("recommendation-service")`, Feign удалён.
- **Docker:** порт `9093:9093` для recommendation-service.

### 2. review-service, quiz-service ↔ image-storage-service

- **api-grpc:** `image_storage.proto` — `ImageStorageService.UploadImage`, `DeleteImage`.
- **image-storage-service:** gRPC-сервер на порту **9094**, `ImageStorageGrpcServiceImpl`; в `S3Service` добавлен метод `uploadImage(byte[], fileName)` для gRPC.
- **review-service** и **quiz-service:** gRPC-клиенты `@GrpcClient("image-storage-service")`, Feign удалён.
- **Docker:** порт `9094:9094` для image-storage-service.

### Сборка

1. Собрать **api-grpc** (нужен до сборки recommendation-service, user-service, image-storage-service, review-service, quiz-service):
   ```cmd
   cd backend\api-grpc
   mvn clean install -DskipTests
   ```
   Либо использовать **build-all-jars.bat** — он сначала собирает common-dto, затем api-grpc, затем все сервисы.

2. Запуск стека:
   ```cmd
   cd backend
   .\docker-compose-up.bat
   ```

### Порты gRPC

| Сервис                 | HTTP (REST) | gRPC   |
|------------------------|-------------|--------|
| recommendation-service | 8083        | 9093   |
| image-storage-service  | 8086        | 9094   |

Обращения к внешним API (TMDB и т.п.) по-прежнему по REST (RestTemplate). Фронтенд обращается к бэкенду по REST (user-service, auth-service, playback-service и т.д.).
