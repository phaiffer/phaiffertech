resource "google_artifact_registry_repository" "applications" {
  location      = var.region
  repository_id = local.artifact_registry_repository_id
  description   = "Private Docker repository for ${local.name_prefix} services."
  format        = "DOCKER"

  depends_on = [google_project_service.required["artifactregistry.googleapis.com"]]
}
