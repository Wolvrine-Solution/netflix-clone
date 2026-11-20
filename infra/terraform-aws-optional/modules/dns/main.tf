variable "project" { type = string }
variable "cdn_domain" { type = string }

output "zone_name" {
  value = "${var.project}.example.com"
}
