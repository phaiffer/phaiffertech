resource "google_cloud_run_v2_service" "backend" {
  count = var.deploy_backend_service ? 1 : 0

  name                = local.backend_service_name
  location            = var.region
  ingress             = var.backend_ingress
  deletion_protection = var.service_deletion_protection

  lifecycle {
    precondition {
      condition     = trimspace(var.backend_image) != ""
      error_message = "Set var.backend_image before enabling deploy_backend_service."
    }

    precondition {
      condition     = trimspace(var.allowed_cors_origins) != ""
      error_message = "Set var.allowed_cors_origins before enabling deploy_backend_service."
    }
  }

  template {
    service_account                  = google_service_account.backend.email
    timeout                          = "${var.backend_timeout_seconds}s"
    max_instance_request_concurrency = var.backend_concurrency

    scaling {
      min_instance_count = var.backend_min_instances
      max_instance_count = var.backend_max_instances
    }

    containers {
      image = var.backend_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.backend_cpu
          memory = var.backend_memory
        }
      }

      startup_probe {
        failure_threshold = 10
        timeout_seconds   = 3
        period_seconds    = 10

        http_get {
          path = "/actuator/health"
          port = 8080
        }
      }

      liveness_probe {
        failure_threshold = 3
        timeout_seconds   = 3
        period_seconds    = 30

        http_get {
          path = "/actuator/health"
          port = 8080
        }
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "prod"
      }

      env {
        name  = "APP_CORS_ALLOWED_ORIGINS"
        value = var.allowed_cors_origins
      }

      env {
        name  = "APP_SECURITY_JWT_ISSUER"
        value = var.jwt_issuer
      }

      env {
        name  = "APP_SECURITY_JWT_REFRESH_COOKIE_SECURE"
        value = "true"
      }

      env {
        name  = "APP_SECURITY_JWT_REFRESH_COOKIE_SAME_SITE"
        value = "Strict"
      }

      env {
        name  = "APP_SECURITY_PUBLIC_DOCS_ENABLED"
        value = "false"
      }

      env {
        name  = "APP_SECURITY_PUBLIC_OBSERVABILITY_ENABLED"
        value = "false"
      }

      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = tostring(var.backend_hikari_maximum_pool_size)
      }

      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "0"
      }

      env {
        name  = "SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT_MS"
        value = "10000"
      }

      env {
        name = "SPRING_DATASOURCE_URL"

        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${google_secret_manager_secret.runtime["SPRING_DATASOURCE_URL"].secret_id}"
            version = "latest"
          }
        }
      }

      env {
        name = "SPRING_DATASOURCE_USERNAME"

        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${google_secret_manager_secret.runtime["SPRING_DATASOURCE_USERNAME"].secret_id}"
            version = "latest"
          }
        }
      }

      env {
        name = "SPRING_DATASOURCE_PASSWORD"

        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${google_secret_manager_secret.runtime["SPRING_DATASOURCE_PASSWORD"].secret_id}"
            version = "latest"
          }
        }
      }

      env {
        name = "APP_SECURITY_JWT_SECRET"

        value_source {
          secret_key_ref {
            secret  = "projects/${var.project_id}/secrets/${google_secret_manager_secret.runtime["APP_SECURITY_JWT_SECRET"].secret_id}"
            version = "latest"
          }
        }
      }

      dynamic "env" {
        for_each = var.demo_assisted_enabled ? [1] : []

        content {
          name  = "APP_DEMO_ASSISTED_ENABLED"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = var.demo_assisted_enabled ? [1] : []

        content {
          name  = "APP_DEMO_ASSISTED_TENANT_CODE"
          value = var.demo_assisted_tenant_code
        }
      }

      dynamic "env" {
        for_each = var.demo_assisted_enabled ? [1] : []

        content {
          name  = "APP_DEMO_ASSISTED_USER_EMAIL"
          value = var.demo_assisted_user_email
        }
      }

      dynamic "env" {
        for_each = var.demo_assisted_enabled ? [1] : []

        content {
          name  = "APP_DEMO_ASSISTED_FEATURE_FLAG_KEY"
          value = var.demo_assisted_feature_flag_key
        }
      }

      dynamic "env" {
        for_each = var.demo_assisted_enabled ? [1] : []

        content {
          name  = "APP_DEMO_ASSISTED_ENFORCE_FEATURE_FLAG"
          value = tostring(var.demo_assisted_enforce_feature_flag)
        }
      }

      dynamic "env" {
        for_each = var.demo_assisted_enabled ? [1] : []

        content {
          name = "APP_DEMO_ASSISTED_USER_PASSWORD"

          value_source {
            secret_key_ref {
              secret  = "projects/${var.project_id}/secrets/${google_secret_manager_secret.runtime["APP_DEMO_ASSISTED_USER_PASSWORD"].secret_id}"
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.master_admin_bootstrap_enabled ? [1] : []

        content {
          name  = "APP_BOOTSTRAP_MASTER_ADMIN_ENABLED"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = var.master_admin_bootstrap_enabled ? [1] : []

        content {
          name  = "APP_BOOTSTRAP_MASTER_ADMIN_TENANT_CODE"
          value = var.master_admin_tenant_code
        }
      }

      dynamic "env" {
        for_each = var.master_admin_bootstrap_enabled ? [1] : []

        content {
          name  = "APP_BOOTSTRAP_MASTER_ADMIN_TENANT_NAME"
          value = var.master_admin_tenant_name
        }
      }

      dynamic "env" {
        for_each = var.master_admin_bootstrap_enabled ? [1] : []

        content {
          name  = "APP_BOOTSTRAP_MASTER_ADMIN_EMAIL"
          value = var.master_admin_email
        }
      }

      dynamic "env" {
        for_each = var.master_admin_bootstrap_enabled ? [1] : []

        content {
          name  = "APP_BOOTSTRAP_MASTER_ADMIN_FULL_NAME"
          value = var.master_admin_full_name
        }
      }

      dynamic "env" {
        for_each = var.master_admin_bootstrap_enabled ? [1] : []

        content {
          name = "APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD"

          value_source {
            secret_key_ref {
              secret  = "projects/${var.project_id}/secrets/${google_secret_manager_secret.runtime["APP_BOOTSTRAP_MASTER_ADMIN_PASSWORD"].secret_id}"
              version = "latest"
            }
          }
        }
      }
    }
  }

  depends_on = [
    google_project_service.required["run.googleapis.com"],
    google_project_iam_member.backend_cloudsql_client,
    google_secret_manager_secret_iam_member.backend_secret_accessor
  ]
}

resource "google_cloud_run_v2_service" "frontend" {
  count = var.deploy_frontend_service ? 1 : 0

  name                = local.frontend_service_name
  location            = var.region
  ingress             = var.frontend_ingress
  deletion_protection = var.service_deletion_protection

  lifecycle {
    precondition {
      condition     = trimspace(var.frontend_image) != ""
      error_message = "Set var.frontend_image before enabling deploy_frontend_service."
    }
  }

  template {
    service_account                  = google_service_account.frontend.email
    timeout                          = "${var.frontend_timeout_seconds}s"
    max_instance_request_concurrency = var.frontend_concurrency

    scaling {
      min_instance_count = var.frontend_min_instances
      max_instance_count = var.frontend_max_instances
    }

    containers {
      image = var.frontend_image

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = var.frontend_cpu
          memory = var.frontend_memory
        }
      }

      startup_probe {
        failure_threshold = 10
        timeout_seconds   = 3
        period_seconds    = 10

        http_get {
          path = "/"
          port = 3000
        }
      }

      liveness_probe {
        failure_threshold = 3
        timeout_seconds   = 3
        period_seconds    = 30

        http_get {
          path = "/"
          port = 3000
        }
      }

      env {
        name  = "NEXT_TELEMETRY_DISABLED"
        value = "1"
      }
    }
  }

  depends_on = [google_project_service.required["run.googleapis.com"]]
}

resource "google_cloud_run_service_iam_member" "backend_public" {
  count = var.deploy_backend_service ? 1 : 0

  service  = google_cloud_run_v2_service.backend[0].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  count = var.deploy_frontend_service ? 1 : 0

  service  = google_cloud_run_v2_service.frontend[0].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
