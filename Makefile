.PHONY: dev migrate build clean

# Запуск приложения в режиме разработки
dev:
	docker-compose up --build

# Запуск миграций
migrate:
	docker-compose --profile migrate up migrate

# Сборка приложения
build:
	docker-compose build

# Очистка контейнеров и volumes
clean:
	docker-compose down -v --remove-orphans

# Полная перезагрузка с миграциями
reset:
	docker-compose down -v --remove-orphans
	docker volume rm familyfinance_postgres_data || true
	docker-compose --profile migrate up migrate
	docker-compose up --build
