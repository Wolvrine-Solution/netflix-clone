variable "project" { type = string }

output "bucket_name" {
  value = "${var.project}-vod-origin"
}
