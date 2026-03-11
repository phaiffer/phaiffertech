variable "region" {
  type        = string
  description = "OCI region"
}

variable "tenancy_ocid" {
  type        = string
  description = "OCI tenancy OCID"
}

variable "user_ocid" {
  type        = string
  description = "OCI user OCID"
}

variable "fingerprint" {
  type        = string
  description = "API key fingerprint"
}

variable "private_key_path" {
  type        = string
  description = "Path to OCI private key"
}

variable "compartment_ocid" {
  type        = string
  description = "Compartment OCID where resources will be created"
}

variable "availability_domain" {
  type        = string
  description = "Availability domain for compute resources"
}

variable "vcn_cidr" {
  type        = string
  description = "VCN CIDR block"
  default     = "10.10.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "Public subnet CIDR"
  default     = "10.10.1.0/24"
}

variable "private_subnet_cidr" {
  type        = string
  description = "Private subnet CIDR"
  default     = "10.10.2.0/24"
}

variable "app_instance_shape" {
  type        = string
  description = "App compute shape"
  default     = "VM.Standard.E4.Flex"
}

variable "app_instance_ocpus" {
  type        = number
  description = "App instance OCPUs"
  default     = 1
}

variable "app_instance_memory_gb" {
  type        = number
  description = "App instance memory in GB"
  default     = 8
}

variable "app_image_ocid" {
  type        = string
  description = "OCI image OCID for app instances"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key for compute access"
}

variable "postgresql_db_version" {
  type        = string
  description = "OCI PostgreSQL database version"
  default     = "14"
}

variable "postgresql_display_name" {
  type        = string
  description = "OCI PostgreSQL display name"
  default     = "platform-postgresql"
}

variable "postgresql_shape" {
  type        = string
  description = "OCI PostgreSQL compute shape"
  default     = "PostgreSQL.VM.Standard.E4.2.32GB"
}

variable "postgresql_instance_count" {
  type        = number
  description = "OCI PostgreSQL instance count"
  default     = 1
}

variable "postgresql_instance_ocpu_count" {
  type        = number
  description = "OCI PostgreSQL instance OCPU count"
  default     = 2
}

variable "postgresql_instance_memory_gb" {
  type        = number
  description = "OCI PostgreSQL instance memory in GB"
  default     = 32
}

variable "postgresql_storage_regionally_durable" {
  type        = bool
  description = "OCI PostgreSQL storage durability mode"
  default     = false
}

variable "postgresql_storage_system_type" {
  type        = string
  description = "OCI PostgreSQL storage system type"
  default     = "OCI_OPTIMIZED_STORAGE"
}

variable "postgresql_admin_username" {
  type        = string
  description = "PostgreSQL admin username"
  default     = "platform_admin"
}

variable "postgresql_admin_password" {
  type        = string
  description = "PostgreSQL admin password"
  sensitive   = true
}
