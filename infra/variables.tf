variable "project_name" { type = string }
variable "domain_name" { type = string }
variable "alternate_domain" { type = string }
variable "hosted_zone_id" { type = string }
variable "price_class" {
  type    = string
  default = "PriceClass_100"
}
variable "project" { default = "solowitluv" }
variable "region" { default = "us-east-1" }
variable "cloudfront_domain" { description = "Domain to prefix image keys" }