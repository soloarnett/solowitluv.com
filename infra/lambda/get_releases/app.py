# app.py
import json
import os
import boto3
from boto3.dynamodb.conditions import Attr

ddb = boto3.resource("dynamodb")

def build_url(domain: str, key: str, proto: str = "https") -> str:
    domain = domain.lstrip("https://").lstrip("http://")
    if key.startswith("/"):
        key = key[1:]
    return f"{proto}://{domain}/{key}"


def lambda_handler(event, context):
    table_name = os.environ.get("TABLE_NAME", "releases")
    domain = os.environ.get("CLOUDFRONT_DOMAIN", "")
    proto = os.environ.get("IMAGE_PROTOCOL", "https")
    allowed_status = os.environ.get("ALLOWED_STATUS", "").strip()

    table = ddb.Table(table_name)

    # Full table scan for simplicity
    scan_kwargs = {}
    items = []
    start_key = None
    while True:
        if start_key:
            scan_kwargs["ExclusiveStartKey"] = start_key
        resp = table.scan(**scan_kwargs)
        items.extend(resp.get("Items", []))
        start_key = resp.get("LastEvaluatedKey")
        if not start_key:
            break

    # Sort: album(s) first, then singles
    items.sort(key=lambda x: (0 if x.get("type") == "album" else 1, x.get("releaseDate", "")), reverse=True)

    # Normalize + map image URLs (if present)
    out = []
    for it in items:
        # For compatibility, add image_url/thumb_url if heroImage/coverArt present
        if domain:
            if it.get("heroImage"):
                it["image_url"] = build_url(domain, it["heroImage"], proto)
            if it.get("coverArt"):
                it["thumb_url"] = build_url(domain, it["coverArt"], proto)
        out.append(it)

    body = {"count": len(out), "items": out}

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            # CORS (mirror in API GW if desired)
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body),
    }
