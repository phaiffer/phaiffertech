resource "oci_core_network_security_group" "app_nsg" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_virtual_network.platform_vcn.id
  display_name   = "platform-app-nsg"
}

resource "oci_core_network_security_group_security_rule" "app_nsg_http" {
  network_security_group_id = oci_core_network_security_group.app_nsg.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"

  tcp_options {
    destination_port_range {
      min = 8080
      max = 8080
    }
  }
}

resource "oci_core_network_security_group_security_rule" "app_nsg_egress" {
  network_security_group_id = oci_core_network_security_group.app_nsg.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
}

resource "oci_core_instance" "app_instance" {
  compartment_id      = var.compartment_ocid
  availability_domain = var.availability_domain
  display_name        = "platform-app-1"
  shape               = var.app_instance_shape

  shape_config {
    ocpus         = var.app_instance_ocpus
    memory_in_gbs = var.app_instance_memory_gb
  }

  source_details {
    source_type = "image"
    source_id   = var.app_image_ocid
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
  }

  create_vnic_details {
    subnet_id              = oci_core_subnet.public_subnet.id
    assign_public_ip       = true
    display_name           = "platform-app-vnic"
    nsg_ids                = [oci_core_network_security_group.app_nsg.id]
    skip_source_dest_check = false
  }
}

resource "oci_load_balancer_load_balancer" "platform_lb" {
  compartment_id = var.compartment_ocid
  display_name   = "platform-lb"
  shape          = "flexible"
  subnet_ids     = [oci_core_subnet.public_subnet.id]
  is_private     = false

  shape_details {
    minimum_bandwidth_in_mbps = 10
    maximum_bandwidth_in_mbps = 100
  }
}

resource "oci_load_balancer_backend_set" "platform_backend_set" {
  load_balancer_id = oci_load_balancer_load_balancer.platform_lb.id
  name             = "platform-backend-set"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol = "HTTP"
    port     = 8080
    url_path = "/api/v1/health"
  }
}

resource "oci_load_balancer_backend" "platform_backend_node" {
  load_balancer_id = oci_load_balancer_load_balancer.platform_lb.id
  backendset_name  = oci_load_balancer_backend_set.platform_backend_set.name
  ip_address       = oci_core_instance.app_instance.private_ip
  port             = 8080
  weight           = 1
}

resource "oci_load_balancer_listener" "platform_http_listener" {
  load_balancer_id         = oci_load_balancer_load_balancer.platform_lb.id
  name                     = "http-80"
  default_backend_set_name = oci_load_balancer_backend_set.platform_backend_set.name
  port                     = 80
  protocol                 = "HTTP"
}
