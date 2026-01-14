import json
import boto3
import os

# Configuration
TABLE_NAME = "solowitluv-releases"
REGION = "us-east-1"
RELEASES_JSON = os.path.join(os.path.dirname(__file__), "releases.json")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

def main():
    with open(RELEASES_JSON, "r") as f:
        data = json.load(f)

    releases = data.get("releases", [])
    for release in releases:
        # Use title as unique id (ensure no duplicates)
        item = {"id": release["title"], **release}
        table.put_item(Item=item)
        print(f"Inserted: {item['id']}")

if __name__ == "__main__":
    main()
