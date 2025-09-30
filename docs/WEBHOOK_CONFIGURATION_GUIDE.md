# Supabase Webhook Configuration Guide

## Manual Configuration via Supabase Dashboard

### Prerequisites

- Access to your Supabase project dashboard
- Database → Webhooks section
- ProspectPro deployed at: `https://prospectpro-uswbuyt7ha-uc.a.run.app`

### Webhook Authentication Token

```
wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2
```

---

## Webhook 1: Campaign Lifecycle Monitor

### Conditions to fire webhook

- **Table**: `business_discovery_campaigns`
- **Events**:
  - ☑️ Insert (Any insert operation on the table)
  - ☑️ Update (Any update operation, of any column in the table)
  - ☐ Delete

### Webhook configuration

- **Type of webhook**: HTTP Request
- **Method**: POST
- **URL**: `https://prospectpro-uswbuyt7ha-uc.a.run.app/api/webhooks/campaign-lifecycle`
- **Timeout**: 5000 ms

### HTTP Headers

- **Content-type**: `application/json`
- **Authorization**: `Bearer wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2`

### HTTP Parameters

- (Leave empty - data will be sent in request body)

---

## Webhook 2: Cost Alert Monitor

### Conditions to fire webhook

- **Table**: `campaign_costs`
- **Events**:
  - ☑️ Insert (Any insert operation on the table)
  - ☑️ Update (Any update operation, of any column in the table)
  - ☐ Delete

### Webhook configuration

- **Type of webhook**: HTTP Request
- **Method**: POST
- **URL**: `https://prospectpro-uswbuyt7ha-uc.a.run.app/api/webhooks/cost-alert`
- **Timeout**: 5000 ms

### HTTP Headers

- **Content-type**: `application/json`
- **Authorization**: `Bearer wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2`

### HTTP Parameters

- (Leave empty - data will be sent in request body)

---

## Webhook 3: Lead Enrichment Processor

### Conditions to fire webhook

- **Table**: `business_contacts`
- **Events**:
  - ☑️ Insert (Any insert operation on the table)
  - ☑️ Update (Any update operation, of any column in the table)
  - ☐ Delete

### Webhook configuration

- **Type of webhook**: HTTP Request
- **Method**: POST
- **URL**: `https://prospectpro-uswbuyt7ha-uc.a.run.app/api/webhooks/lead-enrichment`
- **Timeout**: 5000 ms

### HTTP Headers

- **Content-type**: `application/json`
- **Authorization**: `Bearer wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2`

### HTTP Parameters

- (Leave empty - data will be sent in request body)

---

## Testing Webhooks

After configuration, test each webhook:

```bash
# Test campaign lifecycle webhook
curl -X POST https://prospectpro-uswbuyt7ha-uc.a.run.app/api/webhooks/campaign-lifecycle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2" \
  -d '{"test": true}'

# Test cost alert webhook
curl -X POST https://prospectpro-uswbuyt7ha-uc.a.run.app/api/webhooks/cost-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2" \
  -d '{"test": true}'

# Test lead enrichment webhook
curl -X POST https://prospectpro-uswbuyt7ha-uc.a.run.app/api/webhooks/lead-enrichment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wh_f7616c7477f7e2072912c82360bf048ce88950be5d746490a0b3e74ba2bab3a2" \
  -d '{"test": true}'
```

## Database Tables Required

Ensure these tables exist in your Supabase database:

- `business_discovery_campaigns` - Campaign tracking
- `campaign_costs` - Cost monitoring
- `business_contacts` - Lead storage and enrichment

If tables don't exist, run the database setup scripts in `/database/` folder.
