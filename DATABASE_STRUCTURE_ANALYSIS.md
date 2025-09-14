# Database Structure Analysis - Current vs Enhanced Schema

## Current Database Tables (Existing)

### Core Tables
1. **businesses** - Main business data (replaces enhanced_leads)
2. **campaigns** - Campaign management  
3. **api_usage** - Detailed API usage tracking
4. **api_usage_log** - Simplified API usage log
5. **user_settings** - User preferences and settings
6. **export_history** - Export tracking

### Supporting Tables  
7. **campaign_analytics** - Basic campaign metrics
8. **lead_emails** - Email data (references enhanced_leads - CONFLICT)
9. **lead_social_profiles** - Social media data (references enhanced_leads - CONFLICT)

## Enhanced Schema Tables (Proposed)

### New Tables Not in Current DB
1. **enhanced_leads** - Advanced lead structure
2. **api_cost_tracking** - Dashboard cost monitoring
3. **lead_qualification_metrics** - Quality metrics for dashboard
4. **service_health_metrics** - API health monitoring  
5. **dashboard_exports** - Dashboard export management

## Key Conflicts & Issues

### 1. Table Name Conflicts
- **Current**: `businesses` table stores lead data
- **Enhanced**: `enhanced_leads` table stores lead data
- **Foreign Key Issues**: `lead_emails` and `lead_social_profiles` reference `enhanced_leads.id` but should reference `businesses.id`

### 2. Duplicate API Tracking
- **Current**: `api_usage` (detailed) + `api_usage_log` (simple)  
- **Enhanced**: `api_usage_log` + `api_cost_tracking`
- **Issue**: Overlapping functionality, potential conflicts

### 3. Campaign Analytics Differences
- **Current**: `campaign_analytics` (bigint id, simple structure)
- **Enhanced**: `campaign_analytics` (UUID id, complex structure)
- **Issue**: Different primary key types and column structures

### 4. Missing Required Extensions
- **PostGIS**: Required for location_coordinates (point type)
- **uuid-ossp**: Required for UUID generation

## Resolution Strategy

### Option 1: Adapt Enhanced Schema to Current Structure
- Use `businesses` table instead of `enhanced_leads`
- Extend existing `api_usage` instead of creating new tracking tables
- Enhance existing `campaign_analytics` instead of replacing
- Add only necessary new tables for dashboard functionality

### Option 2: Migration Approach  
- Create migration scripts to rename/restructure existing tables
- Higher risk but cleaner final structure

**Recommendation**: Option 1 - Adapt enhanced schema to work with existing structure