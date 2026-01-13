variable "project_name" {
  type    = string
  default = "solowitluv-artist-site"
}
variable "domain_name" {
  type    = string
  default = "solowitluv.com"
}
variable "alternate_domain" {
  type    = string
  default = "www.solowitluv.com"
}
variable "hosted_zone_id" {
  type        = string
  description = "solowitluv.com Hosted Zone ID"
  default     = "Z02121601AA9I81LBQEQX"
}
variable "price_class" {
  type    = string
  default = "PriceClass_100"
}
variable "project" { default = "solowitluv" }
variable "region" { default = "us-east-1" }
variable "cloudfront_domain" {
  type        = string
  description = "Domain to prefix image keys"
  default     = "d1z84g1aggelb.cloudfront.net"
}
