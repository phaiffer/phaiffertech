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

variable "mysql_admin_username" {
  type        = string
  description = "MySQL admin username"
  default     = "platform_admin"
}

variable "mysql_admin_password" {
  type        = string
  description = "MySQL admin password"
  sensitive   = true
}
