output "load_balancer_url" {
  description = "Load Balancer URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}