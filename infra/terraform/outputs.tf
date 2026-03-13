output "vpc_id" {
  description = "Platform VPC network ID"
  value       = google_compute_network.platform_vpc.id
}

output "subnet_id" {
  description = "Subnet ID"
  value       = google_compute_subnetwork.platform_subnet.id
}

output "app_instance_external_ip" {
  description = "External IP address of the app instance"
  value       = google_compute_instance.app_instance.network_interface.0.access_config.0.nat_ip
}

output "app_instance_internal_ip" {
  description = "Internal IP address of the app instance"
  value       = google_compute_instance.app_instance.network_interface.0.network_ip
}
