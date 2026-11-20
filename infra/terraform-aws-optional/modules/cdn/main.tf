variable "project" { type = string }
variable "bucket" { type = string }

output "domain_name" {
  value = "cdn.${var.project}.example.com"
}
