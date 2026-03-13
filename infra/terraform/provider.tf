terraform {
  required_version = ">= 1.5.0"

  backend "gcs" {
    bucket = "phaiffertech-tf-state-storage"
    prefix = "terraform/state"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
  zone    = var.gcp_zone
}
