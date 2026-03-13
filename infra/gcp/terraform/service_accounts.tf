resource "google_service_account" "backend" {
  account_id   = local.backend_service_account_id
  display_name = "${local.name_prefix} backend runtime"

  depends_on = [google_project_service.required["iam.googleapis.com"]]
}

resource "google_service_account" "frontend" {
  account_id   = local.frontend_service_account_id
  display_name = "${local.name_prefix} frontend runtime"

  depends_on = [google_project_service.required["iam.googleapis.com"]]
}

resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend.email}"
}
