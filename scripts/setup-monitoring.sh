#!/bin/bash

# Google Cloud Monitoring Setup for ProspectPro
# Creates uptime checks, alerting policies, and dashboards

set -e

PROJECT_ID="leadgen-471822"
SERVICE_URL="https://prospectpro-uswbuyt7ha-uc.a.run.app"
NOTIFICATION_EMAIL="alextorelli28@gmail.com"

echo "🔍 Setting up Google Cloud Monitoring for ProspectPro"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_URL"

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable monitoring.googleapis.com --project=$PROJECT_ID
gcloud services enable logging.googleapis.com --project=$PROJECT_ID

# Create notification channel for email alerts
echo "📧 Creating notification channel..."
NOTIFICATION_CHANNEL=$(gcloud alpha monitoring channels create \
  --display-name="ProspectPro Alerts" \
  --type=email \
  --channel-labels=email_address=$NOTIFICATION_EMAIL \
  --project=$PROJECT_ID \
  --format="value(name)")

echo "✅ Notification channel created: $NOTIFICATION_CHANNEL"

# Create uptime check for health endpoint
echo "🏥 Creating health endpoint uptime check..."
cat > /tmp/health-uptime-check.json << EOF
{
  "displayName": "ProspectPro Health Check",
  "httpCheck": {
    "path": "/health",
    "port": 443,
    "useSsl": true
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "host": "prospectpro-uswbuyt7ha-uc.a.run.app"
    }
  },
  "timeout": "10s",
  "period": "60s"
}
EOF

UPTIME_CHECK=$(gcloud monitoring uptime create --config-from-file=/tmp/health-uptime-check.json --project=$PROJECT_ID --format="value(name)")

echo "✅ Uptime check created: $UPTIME_CHECK"

# Create uptime check for API endpoint
echo "🔍 Creating API endpoint uptime check..."
cat > /tmp/api-uptime-check.json << EOF
{
  "displayName": "ProspectPro API Check",
  "httpCheck": {
    "path": "/api/business/discover-businesses",
    "port": 443,
    "useSsl": true,
    "requestMethod": "GET"
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "host": "prospectpro-uswbuyt7ha-uc.a.run.app"
    }
  },
  "timeout": "30s",
  "period": "300s"
}
EOF

API_UPTIME_CHECK=$(gcloud monitoring uptime create --config-from-file=/tmp/api-uptime-check.json --project=$PROJECT_ID --format="value(name)")

echo "✅ API uptime check created: $API_UPTIME_CHECK"

# Create alerting policy for uptime failures
echo "🚨 Creating uptime alerting policy..."
cat > /tmp/uptime-alert-policy.json << EOF
{
  "displayName": "ProspectPro Service Down Alert",
  "conditions": [
    {
      "displayName": "Uptime check failure",
      "conditionThreshold": {
        "filter": "resource.type=\"uptime_url\" AND metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\"",
        "comparison": "COMPARISON_EQUAL",
        "thresholdValue": 0,
        "duration": "120s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_FRACTION_TRUE"
          }
        ]
      }
    }
  ],
  "notificationChannels": ["$NOTIFICATION_CHANNEL"],
  "alertStrategy": {
    "autoClose": "1800s"
  },
  "enabled": true
}
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/uptime-alert-policy.json --project=$PROJECT_ID

# Create alerting policy for high error rate
echo "📊 Creating error rate alerting policy..."
cat > /tmp/error-rate-alert-policy.json << EOF
{
  "displayName": "ProspectPro High Error Rate Alert",
  "conditions": [
    {
      "displayName": "High 4xx/5xx error rate",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"prospectpro\" AND metric.type=\"run.googleapis.com/request_count\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 10,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM",
            "groupByFields": ["resource.labels.service_name"]
          }
        ]
      }
    }
  ],
  "notificationChannels": ["$NOTIFICATION_CHANNEL"],
  "alertStrategy": {
    "autoClose": "3600s"
  },
  "enabled": true
}
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/error-rate-alert-policy.json --project=$PROJECT_ID

# Create custom dashboard
echo "📈 Creating custom monitoring dashboard..."
cat > /tmp/dashboard-config.json << EOF
{
  "displayName": "ProspectPro Monitoring Dashboard",
  "mosaicLayout": {
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Count",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"prospectpro\" AND metric.type=\"run.googleapis.com/request_count\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Requests/sec",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Response Latency",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"prospectpro\" AND metric.type=\"run.googleapis.com/request_latencies\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_PERCENTILE_95"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Latency (ms)",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "yPos": 4,
        "width": 12,
        "height": 4,
        "widget": {
          "title": "Uptime Check Results",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"uptime_url\" AND metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_FRACTION_TRUE"
                    }
                  }
                },
                "plotType": "LINE"
              }
            ],
            "timeshiftDuration": "0s",
            "yAxis": {
              "label": "Success Rate",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
EOF

DASHBOARD=$(gcloud monitoring dashboards create --config-from-file=/tmp/dashboard-config.json --project=$PROJECT_ID --format="value(name)")

echo "✅ Dashboard created: $DASHBOARD"

# Clean up temporary files
rm -f /tmp/uptime-alert-policy.json /tmp/error-rate-alert-policy.json /tmp/dashboard-config.json

echo ""
echo "🎉 Google Cloud Monitoring setup complete!"
echo ""
echo "📊 Access your monitoring:"
echo "   Dashboard: https://console.cloud.google.com/monitoring/dashboards"
echo "   Uptime checks: https://console.cloud.google.com/monitoring/uptime"
echo "   Alerting: https://console.cloud.google.com/monitoring/alerting"
echo ""
echo "📧 Email alerts configured for: $NOTIFICATION_EMAIL"
echo "🔍 Monitoring endpoints:"
echo "   Health: $SERVICE_URL/health"
echo "   API: $SERVICE_URL/api/business/discover-businesses"