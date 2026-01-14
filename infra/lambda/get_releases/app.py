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
    table_name = os.environ.get("TABLE_NAME", "solowitluv-releases")
    domain = os.environ.get("CLOUDFRONT_DOMAIN", "")
    proto = os.environ.get("IMAGE_PROTOCOL", "https")
    allowed_status = os.environ.get("ALLOWED_STATUS", "").strip()
    print(f"Using table: {table_name}")
    print(f"Using domain: {domain}")
    print(f"Using protocol: {proto}")
    print(f"Using allowed status: {allowed_status}")

    table = ddb.Table(table_name)

    # Full table scan for simplicity; switch to Query + GSI if filtering/sorting at scale
    scan_kwargs = {}
    # if allowed_status:
    #     statuses = [s.strip() for s in allowed_status.split(",") if s.strip()]
    #     if statuses:
    #         filt = None
    #         for s in statuses:
    #             cond = Attr("status").eq(s)
    #             filt = cond if filt is None else (filt | cond)
    #         scan_kwargs["FilterExpression"] = filt

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

    # Normalize + map image URLs
    out = []
    print((f"Found {len(items)} items"))
    for it in items:
        image_key = it.get("image_key")
        thumb_key = it.get("thumb_key")
        if domain and image_key:
            it["image_url"] = build_url(domain, image_key, proto)
        if domain and thumb_key:
            it["thumb_url"] = build_url(domain, thumb_key, proto)
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
