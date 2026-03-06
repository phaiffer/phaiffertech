SHELL := /bin/bash

COMPOSE := docker compose
BACKEND_DIR := apps/backend
FRONTEND_DIR := apps/frontend

.PHONY: help up down restart rebuild status logs logs-backend logs-frontend logs-db build test lint clean \
	backend frontend install-backend install-frontend package-backend package-frontend db-shell migrate seed swagger

help: ## List available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nAvailable targets:\n"} /^[a-zA-Z0-9_.-]+:.*##/ { printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

up: ## Start mysql, backend and frontend via Docker Compose
	$(COMPOSE) up -d --build

down: ## Stop and remove containers
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

rebuild: ## Rebuild and recreate all services
	$(COMPOSE) down
	$(COMPOSE) up -d --build --force-recreate

status: ## Show service status
	$(COMPOSE) ps

logs: ## Tail all service logs
	$(COMPOSE) logs -f --tail=200

logs-backend: ## Tail backend logs
	$(COMPOSE) logs -f --tail=200 backend

logs-frontend: ## Tail frontend logs
	$(COMPOSE) logs -f --tail=200 frontend

logs-db: ## Tail mysql logs
	$(COMPOSE) logs -f --tail=200 mysql

build: package-backend package-frontend ## Build backend and frontend artifacts locally

install-backend: ## Resolve backend dependencies
	cd $(BACKEND_DIR) && mvn -q -DskipTests dependency:go-offline

install-frontend: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && npm install

package-backend: ## Package backend with Maven
	cd $(BACKEND_DIR) && mvn -DskipTests package

package-frontend: ## Build frontend for production
	cd $(FRONTEND_DIR) && npm run build

backend: ## Run backend locally (requires local MySQL)
	cd $(BACKEND_DIR) && mvn spring-boot:run

frontend: ## Run frontend locally
	cd $(FRONTEND_DIR) && npm run dev

test: ## Run backend tests
	cd $(BACKEND_DIR) && mvn test

lint: ## Run frontend lint and backend compile validation
	cd $(FRONTEND_DIR) && npm run lint
	cd $(BACKEND_DIR) && mvn -DskipTests compile

clean: ## Clean local build artifacts
	cd $(BACKEND_DIR) && mvn -q clean
	rm -rf $(FRONTEND_DIR)/.next

db-shell: ## Open MySQL shell inside the mysql container
	$(COMPOSE) exec mysql sh -c 'mysql -u"$${MYSQL_USER:-platform_user}" -p"$${MYSQL_PASSWORD:-platform_pass}" "$${MYSQL_DATABASE:-platform_db}"'

migrate: ## Trigger Flyway migrations by starting backend against mysql
	$(COMPOSE) up -d mysql backend

seed: ## Re-run development seed by restarting backend (dev profile)
	$(COMPOSE) restart backend

swagger: ## Print Swagger URL
	@echo "Swagger UI: http://localhost:$${BACKEND_PORT:-8080}/swagger-ui.html"
