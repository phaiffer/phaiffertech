resource "oci_mysql_mysql_db_system" "platform_mysql" {
  compartment_id       = var.compartment_ocid
  availability_domain  = var.availability_domain
  subnet_id            = oci_core_subnet.private_subnet.id
  display_name         = "platform-mysql"
  description          = "Managed MySQL service for Platform SaaS"
  shape_name           = "MySQL.VM.Standard.E3.1.8GB"
  data_storage_size_in_gb = 50
  hostname_label       = "platformmysql"
  admin_username       = var.mysql_admin_username
  admin_password       = var.mysql_admin_password
}
