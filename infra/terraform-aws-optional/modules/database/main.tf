variable "project" { type = string }

output "connection_string" {
  value = "postgresql://user:pass@${var.project}.rds.amazonaws.com:5432/netflix"
}
