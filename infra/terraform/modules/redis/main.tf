variable "project" { type = string }

output "connection_string" {
  value = "redis://${var.project}.cache.amazonaws.com:6379"
}
