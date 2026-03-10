# Playback Service

Микросервис, отвечающий за **просмотр трейлеров и фильмов**.

## Назначение

- Детали фильма для страницы просмотра (Watch)
- Список видео/трейлеров (TMDB)
- Постер для плеера

## API (REST)

- `GET /playback/movies/{movieId}?email=...` — детали фильма
- `GET /playback/movies/{movieId}/videos?email=...` — трейлеры/видео
- `GET /playback/movies/{movieId}/poster` — постер (JPEG)

## Запуск всего проекта

Из каталога **backend** (в CMD):

```cmd
.\docker-compose-up.bat
```

Скрипт соберёт все JAR (включая playback-service) и поднимет Docker Compose. Maven Wrapper (`mvnw.cmd`, `mvnw`, `.mvn/wrapper`) уже добавлен в playback-service.

Порт по умолчанию: **8090**.
