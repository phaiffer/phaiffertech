variable "gcp_project" {
  type        = string
  description = "GCP Project ID"
}

variable "gcp_region" {
  type        = string
  description = "GCP region"
  default     = "us-central1"
}

variable "gcp_zone" {
  type        = string
  description = "GCP zone"
  default     = "us-central1-a"
}

variable "network_cidr" {
  type        = string
  description = "VPC network CIDR block"
  default     = "10.10.0.0/16"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key for compute access"
}

variable "postgres_admin_user" {
  type        = string
  description = "PostgreSQL admin username"
  default     = "platform_admin"
}

variable "postgres_admin_password" {
  type        = string
  description = "PostgreSQL admin password"
  sensitive   = true
}
