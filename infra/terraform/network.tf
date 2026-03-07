resource "oci_core_virtual_network" "platform_vcn" {
  compartment_id = var.compartment_ocid
  display_name   = "platform-vcn"
  cidr_block     = var.vcn_cidr
  dns_label      = "platformvcn"
}

resource "oci_core_internet_gateway" "platform_igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.platform_vcn.id
  display_name   = "platform-igw"
  enabled        = true
}

resource "oci_core_route_table" "public_rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.platform_vcn.id
  display_name   = "platform-public-rt"

  route_rules {
    network_entity_id = oci_core_internet_gateway.platform_igw.id
    destination        = "0.0.0.0/0"
  }
}

resource "oci_core_security_list" "public_sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.platform_vcn.id
  display_name   = "platform-public-sl"

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"

    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"

    tcp_options {
      min = 22
      max = 22
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_subnet" "public_subnet" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_virtual_network.platform_vcn.id
  cidr_block          = var.public_subnet_cidr
  display_name        = "platform-public-subnet"
  route_table_id      = oci_core_route_table.public_rt.id
  security_list_ids   = [oci_core_security_list.public_sl.id]
  prohibit_public_ip_on_vnic = false
  dns_label           = "pubsubnet"
}

resource "oci_core_subnet" "private_subnet" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_virtual_network.platform_vcn.id
  cidr_block          = var.private_subnet_cidr
  display_name        = "platform-private-subnet"
  prohibit_public_ip_on_vnic = true
  dns_label           = "privsubnet"
}
