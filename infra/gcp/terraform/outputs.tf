output "artifact_registry_repository" {
  description = "Artifact Registry Docker repository."
  value       = google_artifact_registry_repository.applications.id
}

output "artifact_registry_repository_url" {
  description = "Artifact Registry hostname/repository path prefix."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.applications.repository_id}"
}

output "cloud_sql_instance_name" {
  description = "Cloud SQL instance name."
  value       = google_sql_database_instance.postgres.name
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name used by the Java connector."
  value       = google_sql_database_instance.postgres.connection_name
}

output "cloud_sql_database_name" {
  description = "Application database name."
  value       = google_sql_database.application.name
}

output "backend_service_account_email" {
  description = "Service account used by the backend Cloud Run service."
  value       = google_service_account.backend.email
}

output "frontend_service_account_email" {
  description = "Service account used by the frontend Cloud Run service."
  value       = google_service_account.frontend.email
}

output "secret_ids" {
  description = "Secret Manager secret IDs created for runtime configuration."
  value       = { for key, value in google_secret_manager_secret.runtime : key => value.secret_id }
}

output "backend_service_url" {
  description = "Cloud Run URL for the backend service."
  value       = var.deploy_backend_service ? google_cloud_run_v2_service.backend[0].uri : null
}

output "frontend_service_url" {
  description = "Cloud Run URL for the frontend service."
  value       = var.deploy_frontend_service ? google_cloud_run_v2_service.frontend[0].uri : null
}
