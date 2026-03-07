output "vcn_id" {
  description = "Platform VCN ID"
  value       = oci_core_virtual_network.platform_vcn.id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = oci_core_subnet.public_subnet.id
}

output "private_subnet_id" {
  description = "Private subnet ID"
  value       = oci_core_subnet.private_subnet.id
}

output "app_instance_id" {
  description = "Application compute instance ID"
  value       = oci_core_instance.app_instance.id
}

output "load_balancer_id" {
  description = "Public load balancer ID"
  value       = oci_load_balancer_load_balancer.platform_lb.id
}

output "mysql_db_system_id" {
  description = "MySQL managed DB system ID"
  value       = oci_mysql_mysql_db_system.platform_mysql.id
}
