resource "google_compute_network" "platform_vpc" {
  name                    = "platform-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "platform_subnet" {
  name          = "platform-subnet"
  ip_cidr_range = var.network_cidr
  region        = var.gcp_region
  network       = google_compute_network.platform_vpc.id
}

resource "google_compute_firewall" "platform_allow_web" {
  name    = "platform-allow-web"
  network = google_compute_network.platform_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}
