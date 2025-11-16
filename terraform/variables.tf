variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "cloudquotes"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "prod"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "cloudquotes"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "docker_image_backend" {
  description = "Backend Docker image"
  type        = string
  default     = "yourusername/cloudquotes-backend:latest"
}

variable "docker_image_frontend" {
  description = "Frontend Docker image"
  type        = string
  default     = "yourusername/cloudquotes-frontend:latest"
}

variable "my_ip" {
  description = "Your IP for SSH"
  type        = string
  default     = "0.0.0.0/0"
}