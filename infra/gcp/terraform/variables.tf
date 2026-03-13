variable "project_id" {
  type        = string
  description = "Google Cloud project ID."
}

variable "region" {
  type        = string
  description = "Primary region for Artifact Registry, Cloud Run and Cloud SQL."
  default     = "us-central1"
}

variable "application_name" {
  type        = string
  description = "Base name used for GCP resources."
  default     = "phaiffertech"
}

variable "environment" {
  type        = string
  description = "Environment suffix used in resource names."
  default     = "prod"
}

variable "database_name" {
  type        = string
  description = "Application database name inside Cloud SQL."
  default     = "platform_prod_db"
}

variable "database_version" {
  type        = string
  description = "Cloud SQL PostgreSQL major version."
  default     = "POSTGRES_16"
}

variable "database_tier" {
  type        = string
  description = "Cloud SQL machine tier."
  default     = "db-custom-1-3840"
}

variable "database_disk_size_gb" {
  type        = number
  description = "Initial Cloud SQL SSD disk size in GB."
  default     = 20
}

variable "database_deletion_protection" {
  type        = bool
  description = "Protect Cloud SQL from accidental deletion."
  default     = true
}

variable "service_deletion_protection" {
  type        = bool
  description = "Protect Cloud Run services from accidental deletion."
  default     = true
}

variable "deploy_backend_service" {
  type        = bool
  description = "Create/update the backend Cloud Run service."
  default     = false
}

variable "deploy_frontend_service" {
  type        = bool
  description = "Create/update the frontend Cloud Run service."
  default     = false
}

variable "backend_image" {
  type        = string
  description = "Full Artifact Registry image URL for the backend service."
  default     = ""
}

variable "frontend_image" {
  type        = string
  description = "Full Artifact Registry image URL for the frontend service."
  default     = ""
}

variable "allowed_cors_origins" {
  type        = string
  description = "Comma-separated origins allowed to call the backend API."
  default     = ""
}

variable "jwt_issuer" {
  type        = string
  description = "JWT issuer value for production."
  default     = "platform-api"
}

variable "backend_ingress" {
  type        = string
  description = "Cloud Run ingress mode for the backend service."
  default     = "INGRESS_TRAFFIC_ALL"
}

variable "frontend_ingress" {
  type        = string
  description = "Cloud Run ingress mode for the frontend service."
  default     = "INGRESS_TRAFFIC_ALL"
}

variable "backend_cpu" {
  type        = string
  description = "Backend CPU limit."
  default     = "1000m"
}

variable "backend_memory" {
  type        = string
  description = "Backend memory limit."
  default     = "1Gi"
}

variable "backend_min_instances" {
  type        = number
  description = "Minimum backend instances."
  default     = 0
}

variable "backend_max_instances" {
  type        = number
  description = "Maximum backend instances."
  default     = 3
}

variable "backend_concurrency" {
  type        = number
  description = "Maximum concurrent requests per backend instance."
  default     = 40
}

variable "backend_timeout_seconds" {
  type        = number
  description = "Backend request timeout in seconds."
  default     = 300
}

variable "backend_hikari_maximum_pool_size" {
  type        = number
  description = "Maximum JDBC connections per backend instance."
  default     = 5
}

variable "frontend_cpu" {
  type        = string
  description = "Frontend CPU limit."
  default     = "1000m"
}

variable "frontend_memory" {
  type        = string
  description = "Frontend memory limit."
  default     = "512Mi"
}

variable "frontend_min_instances" {
  type        = number
  description = "Minimum frontend instances."
  default     = 0
}

variable "frontend_max_instances" {
  type        = number
  description = "Maximum frontend instances."
  default     = 3
}

variable "frontend_concurrency" {
  type        = number
  description = "Maximum concurrent requests per frontend instance."
  default     = 80
}

variable "frontend_timeout_seconds" {
  type        = number
  description = "Frontend request timeout in seconds."
  default     = 120
}

variable "demo_assisted_enabled" {
  type        = bool
  description = "Enable assisted demo login flow in production."
  default     = false
}

variable "demo_assisted_tenant_code" {
  type        = string
  description = "Tenant code used by assisted demo login."
  default     = ""
}

variable "demo_assisted_user_email" {
  type        = string
  description = "User email used by assisted demo login."
  default     = ""
}

variable "demo_assisted_feature_flag_key" {
  type        = string
  description = "Feature flag required by assisted demo login."
  default     = "demo.assisted.enabled"
}

variable "demo_assisted_enforce_feature_flag" {
  type        = bool
  description = "Require the feature flag for assisted demo login in production."
  default     = true
}

variable "master_admin_bootstrap_enabled" {
  type        = bool
  description = "Enable temporary master admin bootstrap."
  default     = false
}

variable "master_admin_tenant_code" {
  type        = string
  description = "Master admin tenant code."
  default     = "PHAIFFER_TECH"
}

variable "master_admin_tenant_name" {
  type        = string
  description = "Master admin tenant name."
  default     = "Willian Phaiffer Cardoso Desenvolvimento de Software LTDA"
}

variable "master_admin_email" {
  type        = string
  description = "Master admin email."
  default     = "sysadmin@phaiffer.tech"
}

variable "master_admin_full_name" {
  type        = string
  description = "Master admin full name."
  default     = "System Administrator"
}
