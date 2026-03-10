# Архитектура микросервисов CinemaRec

## Распределение ответственности

| Сервис | Назначение |
|--------|------------|
| **auth-service** | Регистрация, логин, JWT, OAuth2 (Google). |
| **user-service** | Пользователи, предпочтения, **получение рекомендаций** (по gRPC или Feign). |
| **recommendation-service** | Формирование рекомендаций (Redis, Kafka), детали фильмов для рекомендаций, отметка «просмотрено». |
| **statistics-service** | Статистика пользователя, список просмотренных, поиск фильмов для вкладки Statistics. **Не** отдаёт трейлеры/видео — это делает playback-service. |
| **playback-service** | **Просмотр трейлеров и фильмов:** детали фильма для страницы просмотра, список видео/трейлеров (TMDB), постер для плеера. Единственная точка входа для страницы «Watch». |
| **review-service** | Отзывы. Загрузка изображений через image-storage (REST или gRPC). |
| **quiz-service** | Квизы и результаты. Изображения через image-storage. |
| **image-storage-service** | Загрузка/удаление изображений (S3/Localstack). |
| **proxy-service** | Прокси к TMDB (discover, search). |

## Потоки для воспроизведения (трейлеры/фильмы)

- **Фронтенд (страница Watch)** обращается только к **playback-service** (порт **8090**):
  - `GET /playback/movies/{movieId}` — детали фильма
  - `GET /playback/movies/{movieId}/videos` — трейлеры/видео
  - `GET /playback/movies/{movieId}/poster` — постер

- **statistics-service** больше не отдаёт видео и не является источником данных для страницы просмотра; он нужен только для статистики и поиска фильмов во вкладке Statistics.

## Межсервисное взаимодействие (gRPC)

Целевая схема: микросервисы общаются по **gRPC**.

- В репозитории добавлен модуль **api-grpc** с proto-описанием сервиса рекомендаций:
  - `api-grpc/src/main/proto/recommendation.proto` — `RecommendationService.GetRecommendations`.

Дальнейшие шаги для перевода на gRPC:

1. Собрать и установить api-grpc:  
   `cd backend/api-grpc && mvn clean install -DskipTests`
2. В **recommendation-service**: добавить зависимость на `api-grpc`, поднять gRPC-сервер и реализовать `RecommendationService.GetRecommendations`.
3. В **user-service**: добавить зависимость на `api-grpc`, поднять gRPC-клиент и заменить вызов Feign на вызов gRPC к recommendation-service.
4. Аналогично можно вынести в proto вызовы **review-service** и **quiz-service** к **image-storage-service** и перевести их на gRPC.

Подробнее см. **backend/GRPC.md**.

## Порты

| Сервис | Порт |
|--------|------|
| auth-service | 8081 |
| user-service | 8082 |
| recommendation-service | 8083 |
| review-service | 8085 |
| image-storage-service | 8086 |
| quiz-service | 8087 |
| statistics-service | 8088 |
| **playback-service** | **8090** |
