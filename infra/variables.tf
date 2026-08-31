variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-north-1" # Stockholm — matches your console
}

variable "project" {
  description = "Name prefix applied to all resources"
  type        = string
  default     = "aperture"
}
