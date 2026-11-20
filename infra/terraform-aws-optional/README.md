# AWS Terraform (optional, paid)

Not used by default. Every resource here bills (RDS, ElastiCache, S3, CloudFront, Route 53).
Hub rule `no-paid-cloud`: do not apply without an explicit owner approval in the session that
names the SKU, the monthly estimate and the $0 alternative (docker-compose self-host).

The default deployment is `docker-compose.yml` on a self-hosted or Always Free VM.
