# План очистки БД и перезапуска приложения

## Цель: Очистить базу данных (drop schema public/drizzle) и перезапустить приложение через Docker

### Шаги:
1. [ ] Остановить все Docker контейнеры
2. [ ] Удалить named volumes (особенно postgres_data)
3. [ ] Пересобрать Docker образы
4. [ ] Запустить приложение через docker-compose up
5. [ ] Применить миграции БД
6. [ ] Проверить статус всех сервисов
7. [ ] Убедиться что приложение работает корректно

### Команды для выполнения:
```bash
# Остановить контейнеры
docker-compose down

# Удалить volumes для полной очистки БД
docker-compose down -v

# Пересобрать образы
docker-compose build --no-cache

# Запустить приложение
docker-compose up -d

# Проверить логи
docker-compose logs -f

# Применить миграции если нужно
docker-compose run --rm migrate
