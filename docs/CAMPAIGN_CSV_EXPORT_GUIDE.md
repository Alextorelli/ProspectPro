# Campaign CSV Export Documentation

## Overview

ProspectPro now supports comprehensive CSV export for each campaign with full lead data, validation results, and provenance tracking.

## Export Endpoints

### Campaign-Specific Export

```
GET /api/campaigns/{campaignId}/export?format=csv&minConfidence=70&includeProvenance=true
```

**Parameters:**

- `campaignId` (required): UUID of the campaign to export
- `format`: Export format (default: `csv`)
- `minConfidence`: Minimum confidence score (default: `70`)
- `includeUnqualified`: Include leads below confidence threshold (default: `false`)
- `includeProvenance`: Include source tracking and validation metadata (default: `true`)

**Response Headers:**

- `X-Export-Count`: Number of leads exported
- `X-Total-Count`: Total leads in campaign
- `X-Campaign-Name`: Campaign display name

### Export History

```
GET /api/campaigns/{campaignId}/exports
```

Returns history of all exports for a specific campaign.

## CSV Export Format

### Standard Fields (Always Included)

| Field                | Description                                 |
| -------------------- | ------------------------------------------- |
| Business Name        | Primary business name                       |
| Address              | Complete business address                   |
| Phone                | Primary phone number                        |
| Website              | Business website URL                        |
| Primary Email        | Main contact email                          |
| All Emails           | All discovered emails (semicolon separated) |
| Owner Name           | Business owner/contact name                 |
| Owner Title          | Owner's title/role                          |
| Confidence Score     | Overall quality score (0-100)               |
| Validation Status    | Lead validation status                      |
| Industry/Category    | Business category/type                      |
| Employee Count Est.  | Estimated number of employees               |
| Google Rating        | Google Places rating                        |
| Google Reviews       | Number of Google reviews                    |
| Created Date         | When lead was discovered                    |
| Discovery Source     | How business was found                      |
| Email Source         | How email was discovered                    |
| Website Status       | Website accessibility status                |
| Email Deliverability | Email delivery status                       |
| Phone Validation     | Phone number validation status              |
| Address Validation   | Address validation status                   |
| Total API Cost       | Cost to discover/validate this lead         |
| Cost Per Lead        | Individual cost breakdown                   |

### Provenance Fields (When includeProvenance=true)

| Field                 | Description                    |
| --------------------- | ------------------------------ |
| Google Place ID       | Google Places identifier       |
| Foursquare ID         | Foursquare venue ID            |
| Business Registration | State registration status      |
| Professional License  | Professional licensing status  |
| Chamber Membership    | Chamber of Commerce membership |
| Social Media Links    | Discovered social profiles     |
| Data Quality Score    | Internal quality assessment    |
| Enrichment Timestamp  | When data was last enriched    |

## Frontend Usage

### Main Interface Export

The existing "📊 Export Campaign Data (CSV)" button now intelligently detects:

- **Recent Campaign**: Exports leads from the last search campaign
- **No Campaign**: Falls back to dashboard-wide export

### Real-Time Dashboard Export

The real-time dashboard (`/monitoring`) has a dedicated export button that exports the currently selected campaign.

### Manual JavaScript Usage

```javascript
// Export specific campaign
await prospectPro.exportCampaignLeads(campaignId, {
  minConfidence: 80,
  includeProvenance: true,
  includeUnqualified: false,
});

// Export with custom options
await prospectPro.exportCampaignLeads(campaignId, {
  minConfidence: 60, // Lower threshold
  includeProvenance: false, // Smaller file
  includeUnqualified: true, // All leads
});
```

## Export Quality Filters

### Confidence Score Filtering

- **90+**: Premium leads with full validation
- **80-89**: High-quality leads (default export threshold)
- **70-79**: Good leads with minor validation issues
- **60-69**: Acceptable leads with some missing data
- **Below 60**: Typically excluded unless `includeUnqualified=true`

### Validation Status Filtering

- **Validated**: Complete validation across all data points
- **Validating**: Validation in progress
- **Pending**: Not yet validated
- **Failed**: Validation failed (usually excluded)

## File Naming Convention

```
{Campaign_Name}_{Campaign_ID_8_chars}_{YYYY-MM-DD}.csv
```

**Examples:**

- `Local_Plumbers_San_Diego_a1b2c3d4_2025-09-21.csv`
- `Wellness_Studios_Portland_x9y8z7w6_2025-09-21.csv`

## API Response Examples

### Successful Export

```
HTTP 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="campaign_12345678_2025-09-21.csv"
X-Export-Count: 23
X-Total-Count: 45
X-Campaign-Name: Local Service Businesses

[CSV content follows]
```

### Campaign Not Found

```json
{
  "error": "Campaign not found",
  "details": "No campaign found with ID: 12345678-1234-1234-1234-123456789012"
}
```

### No Leads Available

```json
{
  "error": "No leads found for this campaign",
  "campaign": "Local Service Businesses"
}
```

## Database Integration

### Export Logging

All exports are logged to the `dashboard_exports` table:

- Campaign ID and export parameters
- Export status and completion time
- Row count and file size metrics
- Export history for audit trails

### Campaign Tracking

- Campaign IDs are captured during search operations
- Frontend tracks `lastSearchCampaignId` for intelligent export
- Real-time dashboard maintains current campaign context

## Cost and Performance

### Export Performance

- **Small campaigns** (<50 leads): ~200ms export time
- **Medium campaigns** (50-500 leads): ~500ms export time
- **Large campaigns** (500+ leads): ~1-2s export time

### API Cost Tracking

- Each exported lead includes its individual discovery/validation cost
- Total campaign cost breakdown included in export metadata
- Cost-per-lead calculations for ROI analysis

## Security and Permissions

### Authentication

- All export endpoints require valid session authentication
- Campaign access controlled by user permissions
- Export activity logged for security auditing

### Data Privacy

- Exports contain only validated, legitimate business data
- No personal/private information included
- All data sourced from public APIs and websites

---

**Version**: 1.0  
**Last Updated**: September 21, 2025  
**Compatible with**: ProspectPro v2.0+
