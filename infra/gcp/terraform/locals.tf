locals {
  name_prefix = "${var.application_name}-${var.environment}"

  artifact_registry_repository_id = "${local.name_prefix}-apps"
  backend_service_name            = "${local.name_prefix}-backend"
  frontend_service_name           = "${local.name_prefix}-frontend"
  backend_service_account_id      = substr(replace("${local.name_prefix}-backend-sa", "_", "-"), 0, 30)
  frontend_service_account_id     = substr(replace("${local.name_prefix}-frontend-sa", "_", "-"), 0, 30)
  cloud_sql_instance_name         = substr(replace("${local.name_prefix}-pg", "_", "-"), 0, 63)

  required_services = toset([
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com"
  ])

  runtime_secret_ids = {
    SPRING_DATASOURCE_URL               = "${local.name_prefix}-spring-datasource-url"
    SPRING_DATASOURCE_USERNAME          = "${local.name_prefix}-spring-datasource-username"
    SPRING_DATASOURCE_PASSWORD          = "${local.name_prefix}-spring-datasource-password"
    APP_SECURITY_JWT_SECRET             = "${local.name_prefix}-app-security-jwt-secret"
    APP_DEMO_ASSISTED_USER_PASSWORD     = "${local.name_prefix}-app-demo-assisted-user-password"
    APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD = "${local.name_prefix}-app-bootstrap-master-admin-password"
  }
}
