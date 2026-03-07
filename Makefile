SHELL := /bin/bash

COMPOSE := docker compose
COMPOSE_RAW := docker compose
BACKEND_DIR := apps/backend
FRONTEND_DIR := apps/frontend
TERRAFORM_DIR := infra/terraform
CRM_SEED_SQL := infra/docker/sql/crm-seed.sql
PET_SEED_SQL := infra/docker/sql/pet-seed.sql
IOT_SEED_SQL := infra/docker/sql/iot-seed.sql

.PHONY: help up down restart rebuild status logs logs-follow logs-backend logs-frontend logs-db docker-build docker-reset-db \
	build test test-backend test-integration test-unit test-pet test-iot lint clean backend frontend install-backend install-frontend \
	package-backend package-frontend db-shell migrate seed crm-seed pet-seed iot-seed logs-all swagger verify \
	ci metrics logs-json observability-up observability-down terraform-init terraform-plan

help: ## List available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nAvailable targets:\n"} /^[a-zA-Z0-9_.-]+:.*##/ { printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

up: ## Start mysql, backend and frontend via Docker Compose
	$(COMPOSE) up -d --build

down: ## Stop and remove containers
	$(COMPOSE_RAW) down

restart: ## Restart all services
	$(COMPOSE_RAW) restart mysql backend frontend

rebuild: ## Rebuild and recreate all services
	$(COMPOSE_RAW) down
	$(COMPOSE) up -d --build --force-recreate

status: ## Show service status
	$(COMPOSE_RAW) ps

logs: ## Tail all service logs
	$(COMPOSE_RAW) logs -f --tail=200

logs-follow: logs ## Alias to tail all service logs
logs-all: logs ## Alias to tail all service logs

logs-backend: ## Tail backend logs
	$(COMPOSE_RAW) logs -f --tail=200 backend

logs-frontend: ## Tail frontend logs
	$(COMPOSE_RAW) logs -f --tail=200 frontend

logs-db: ## Tail mysql logs
	$(COMPOSE_RAW) logs -f --tail=200 mysql

logs-json: ## Tail backend JSON structured logs
	$(COMPOSE_RAW) logs -f --tail=200 backend

docker-build: ## Build docker images without starting containers
	$(COMPOSE) build

docker-reset-db: ## Reset database volume and restart stack
	$(COMPOSE_RAW) down -v
	$(COMPOSE) up -d mysql backend frontend

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

test: test-backend ## Run backend tests (unit + integration)

test-backend: ## Run backend test suite
	cd $(BACKEND_DIR) && mvn test

test-integration: ## Run only backend integration tests
	cd $(BACKEND_DIR) && mvn -Dtest='*IntegrationTest' test

test-unit: ## Run backend tests excluding integration classes
	cd $(BACKEND_DIR) && mvn -Dtest='!*IntegrationTest' test

test-pet: ## Run PET integration tests
	cd $(BACKEND_DIR) && mvn -Dtest=PetIntegrationTest test

test-iot: ## Run IoT integration tests
	cd $(BACKEND_DIR) && mvn -Dtest='IotIntegrationTest,IotTelemetryIntegrationTest' test

lint: ## Run frontend lint and backend compile validation
	cd $(FRONTEND_DIR) && npm run lint
	cd $(BACKEND_DIR) && mvn -DskipTests compile

clean: ## Clean local build artifacts
	cd $(BACKEND_DIR) && mvn -q clean
	rm -rf $(FRONTEND_DIR)/.next

db-shell: ## Open MySQL shell inside the mysql container
	$(COMPOSE_RAW) exec mysql sh -c 'mysql -u"$${MYSQL_USER:-platform_user}" -p"$${MYSQL_PASSWORD:-platform_pass}" "$${MYSQL_DATABASE:-platform_db}"'

migrate: ## Trigger Flyway migrations by starting backend against mysql
	$(COMPOSE) up -d mysql backend

seed: ## Re-run development seed by restarting backend (dev profile)
	$(COMPOSE_RAW) restart backend

crm-seed: ## Seed sample CRM contacts and leads for local development
	@test -f $(CRM_SEED_SQL) || (echo "Missing $(CRM_SEED_SQL)" && exit 1)
	$(COMPOSE_RAW) exec -T mysql sh -c 'mysql -u"$${MYSQL_USER:-platform_user}" -p"$${MYSQL_PASSWORD:-platform_pass}" "$${MYSQL_DATABASE:-platform_db}"' < $(CRM_SEED_SQL)

pet-seed: ## Seed sample PET data for local development
	@test -f $(PET_SEED_SQL) || (echo "Missing $(PET_SEED_SQL)" && exit 1)
	$(COMPOSE_RAW) exec -T mysql sh -c 'mysql -u"$${MYSQL_USER:-platform_user}" -p"$${MYSQL_PASSWORD:-platform_pass}" "$${MYSQL_DATABASE:-platform_db}"' < $(PET_SEED_SQL)

iot-seed: ## Seed sample IoT data for local development
	@test -f $(IOT_SEED_SQL) || (echo "Missing $(IOT_SEED_SQL)" && exit 1)
	$(COMPOSE_RAW) exec -T mysql sh -c 'mysql -u"$${MYSQL_USER:-platform_user}" -p"$${MYSQL_PASSWORD:-platform_pass}" "$${MYSQL_DATABASE:-platform_db}"' < $(IOT_SEED_SQL)

swagger: ## Print Swagger URL
	@echo "Swagger UI: http://localhost:$${BACKEND_PORT:-8080}/swagger-ui.html"

metrics: ## Show backend metrics and prometheus scrape output
	@echo "Metrics endpoint:"
	@curl -fsS http://localhost:$${BACKEND_PORT:-8080}/actuator/metrics | sed -n '1,40p'
	@echo "\nPrometheus endpoint (first lines):"
	@curl -fsS http://localhost:$${BACKEND_PORT:-8080}/actuator/prometheus | sed -n '1,30p'

observability-up: ## Start application stack plus observability profile
	$(COMPOSE_RAW) --profile observability up -d mysql backend frontend prometheus grafana loki

observability-down: ## Stop observability services
	-$(COMPOSE_RAW) stop prometheus grafana loki
	-$(COMPOSE_RAW) rm -f prometheus grafana loki

terraform-init: ## Initialize Terraform working directory
	cd $(TERRAFORM_DIR) && terraform init

terraform-plan: ## Generate Terraform execution plan
	cd $(TERRAFORM_DIR) && terraform plan

ci: verify docker-build ## Run local CI flow (verify + docker build)

verify: lint test package-backend package-frontend ## Run lint, tests and build artifacts
