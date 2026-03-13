# Instance definition using Always Free tier e2-micro and 30GB Standard PD
resource "google_compute_instance" "app_instance" {
  name         = "platform-app-1"
  machine_type = "e2-micro"
  zone         = var.gcp_zone
  tags         = ["web-server"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 30
      type  = "pd-standard"
    }
  }

  network_interface {
    network    = google_compute_network.platform_vpc.name
    subnetwork = google_compute_subnetwork.platform_subnet.name
    access_config {
      # Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys       = "willian:${var.ssh_public_key}"
    startup-script = <<-EOF
      #!/bin/bash
      # Update and install Docker
      apt-get update
      apt-get install -y ca-certificates curl gnupg
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
      apt-get update
      apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

      # Run PostgreSQL in Docker
      docker run -d \
        --name postgres \
        --restart unless-stopped \
        -e POSTGRES_USER="${var.postgres_admin_user}" \
        -e POSTGRES_PASSWORD="${var.postgres_admin_password}" \
        -e POSTGRES_DB="phaiffertech" \
        -p 127.0.0.1:5432:5432 \
        -v /var/lib/postgresql/data:/var/lib/postgresql/data \
        postgres:14
    EOF
  }
}

# -------------------------------------------------------------------------------------
# Alternative: Cloud Run (Serverless)
# 
# Usage: Remove the google_compute_instance above and uncomment this block.
# Ensure that your VPC connector is set up if you need to talk to a private database.
# 
# resource "google_cloud_run_v2_service" "backend_service" {
#   name     = "platform-backend"
#   location = var.gcp_region
#   ingress  = "INGRESS_TRAFFIC_ALL"
# 
#   template {
#     containers {
#       image = "gcr.io/placeholder/backend:latest"
#       ports {
#         container_port = 8080
#       }
#       resources {
#         limits = {
#           cpu    = "1000m"
#           memory = "512Mi"
#         }
#       }
#       env {
#         name  = "SPRING_DATASOURCE_URL"
#         value = "jdbc:postgresql://<DB_INSTANCE_IP>:5432/phaiffertech"
#       }
#       env {
#         name  = "SPRING_DATASOURCE_USERNAME"
#         value = var.postgres_admin_user
#       }
#       env {
#         name  = "SPRING_DATASOURCE_PASSWORD"
#         value = var.postgres_admin_password
#       }
#     }
#   }
# }
# -------------------------------------------------------------------------------------
