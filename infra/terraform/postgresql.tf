resource "oci_psql_db_system" "platform_postgresql" {
  compartment_id               = var.compartment_ocid
  db_version                   = var.postgresql_db_version
  display_name                 = var.postgresql_display_name
  description                  = "Managed PostgreSQL service for Platform SaaS"
  shape                        = var.postgresql_shape
  instance_count               = var.postgresql_instance_count
  instance_memory_size_in_gbs  = var.postgresql_instance_memory_gb
  instance_ocpu_count          = var.postgresql_instance_ocpu_count

  credentials {
    username = var.postgresql_admin_username

    password_details {
      password_type = "PLAIN_TEXT"
      password      = var.postgresql_admin_password
    }
  }

  network_details {
    subnet_id = oci_core_subnet.private_subnet.id
  }

  storage_details {
    is_regionally_durable = var.postgresql_storage_regionally_durable
    system_type           = var.postgresql_storage_system_type
  }
}
