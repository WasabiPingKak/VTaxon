#!/bin/bash
# 建立或更新 YouTube WebSub 續訂用的 Cloud Tasks 佇列，並校正續訂排程
# 用法: ./scripts/setup-websub-queue.sh
#
# 佇列不帶參數建立會吃 GCP 預設值（maxAttempts=100、minBackoff=0.1s、同時派發 1000），
# hub 變慢時會變成重試風暴。各項數值的理由見 docs/adr/006-live-detection-webhooks.md
# 可重複執行：佇列不存在就建立，存在就更新成下列設定

PROJECT="vtaxon"
LOCATION="asia-east1"
QUEUE="websub-subscribe"
RENEW_JOB="vtaxon-youtube-renew-subs-prod"
RENEW_SCHEDULE="0 4 * * *"

QUEUE_FLAGS=(
  --max-attempts=3
  --min-backoff=300s
  --max-backoff=3600s
  --max-doublings=3
  --max-dispatches-per-second=1
  --max-concurrent-dispatches=1
)

if gcloud tasks queues describe "$QUEUE" --project="$PROJECT" --location="$LOCATION" >/dev/null 2>&1; then
  echo "=== 更新佇列 $QUEUE ==="
  gcloud tasks queues update "$QUEUE" --project="$PROJECT" --location="$LOCATION" "${QUEUE_FLAGS[@]}" || exit 1
else
  echo "=== 建立佇列 $QUEUE ==="
  gcloud tasks queues create "$QUEUE" --project="$PROJECT" --location="$LOCATION" "${QUEUE_FLAGS[@]}" || exit 1
fi

# 排程帶有 X-Cron-Secret 標頭，這裡不負責建立，只校正既有排程的頻率
if gcloud scheduler jobs describe "$RENEW_JOB" --project="$PROJECT" --location="$LOCATION" >/dev/null 2>&1; then
  echo "=== 校正排程 $RENEW_JOB → $RENEW_SCHEDULE ==="
  gcloud scheduler jobs update http "$RENEW_JOB" --project="$PROJECT" --location="$LOCATION" \
    --schedule="$RENEW_SCHEDULE" || exit 1
else
  echo "找不到排程 $RENEW_JOB，略過（需另外建立，頻率請用 \"$RENEW_SCHEDULE\"）"
fi

echo ""
echo "=== 目前佇列設定 ==="
gcloud tasks queues describe "$QUEUE" --project="$PROJECT" --location="$LOCATION" \
  --format="yaml(rateLimits,retryConfig,state)"
