#!/bin/bash
# 分批重建 Twitch EventSub 訂閱
# 用法: ./scripts/rebuild-twitch-subs.sh <staging|prod> <JWT_TOKEN>

ENV="${1:-staging}"
TOKEN="$2"
LIMIT=20

if [ -z "$TOKEN" ]; then
  echo "用法: $0 <staging|prod> <JWT_TOKEN>"
  exit 1
fi

if [ "$ENV" = "prod" ]; then
  BASE="https://vtaxon-api-prod-klxiexxpsq-de.a.run.app"
elif [ "$ENV" = "staging" ]; then
  BASE="https://vtaxon-api-staging-135773662063.asia-east1.run.app"
else
  echo "環境必須是 staging 或 prod"
  exit 1
fi

echo "目標: $ENV ($BASE)"
echo "每批: $LIMIT 個帳號"
echo ""

parse_has_more() {
  python3 -c "
import json, sys
try:
    data = json.loads(sys.stdin.read())
    print(data.get('has_more', False))
except:
    print('ERROR')
"
}

OFFSET=0

# 第一批：清除舊訂閱
echo "=== Batch offset=$OFFSET (clean) ==="
RESULT=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/livestream/rebuild-twitch-subs?clean=1&offset=$OFFSET&limit=$LIMIT")
echo "$RESULT"
HAS_MORE=$(echo "$RESULT" | parse_has_more)
if [ "$HAS_MORE" = "ERROR" ]; then
  echo "錯誤：API 回傳非 JSON，請確認部署是否完成、JWT 是否有效"
  exit 1
fi
if [ "$HAS_MORE" != "True" ]; then
  echo ""
  echo "Done!"
  exit 0
fi
OFFSET=$((OFFSET + LIMIT))

# 後續批次
while true; do
  sleep 2
  echo "=== Batch offset=$OFFSET ==="
  RESULT=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    "$BASE/api/livestream/rebuild-twitch-subs?offset=$OFFSET&limit=$LIMIT")
  echo "$RESULT"
  HAS_MORE=$(echo "$RESULT" | parse_has_more)
  if [ "$HAS_MORE" = "ERROR" ]; then
    echo "錯誤：API 回傳非 JSON，跳過此批次"
    echo "你可以用 offset=$OFFSET 重新開始"
    exit 1
  fi
  if [ "$HAS_MORE" != "True" ]; then
    echo ""
    echo "Done!"
    break
  fi
  OFFSET=$((OFFSET + LIMIT))
done
