resource "aws_dynamodb_table" "releases" {
  provider     = aws.use1
  name         = "solowitluv-releases"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}