# 📌 Epic: Dual-Source Business Discovery with Foursquare Places API

## Problem Statement

- Current Google Places API costs $32/1K for text search operations

## Solution

hospitality/retail businesses - Limited engagement metrics for

## Acceptance Criteria

- [ ] ependency creates data coverage gaps- Single-source d

## Business Impact

TBD

## Technical Requirements

- Maintain Supabase-first serverless architecture
- Use existing Edge Function authentication patterns
- Follow established coding standards in `.github/copilot-instructions.md`
- Integrate with current VS Code task automation in `.vscode/tasks.json`
- Update system documentation via `npm run docs:update`

### Technical Integration Points

#### 1. Edge Function Modifications

**File**: `/supabase/functions/business-discovery-background/index.ts`
**Changes Needed**:

- Add Foursquare API client alongside Google Places
- Implement dual-source parallel search pattern
- Add data merging and deduplication logic
- Maintain existing Census intelligence and user authentication

#### 2. New Shared Services

**Files to Create**:

- `/supabase/functions/_shared/foursquare-service.ts` - API client with caching
- `/supabase/functions/_shared/dual-source-merger.ts` - Data consolidation logic
- `/supabase/functions/_shared/business-type-router.ts` - Intelligent API routing

#### 3. Enhanced Quality Scoring

**File**: `/supabase/functions/_shared/quality-scoring.ts`
**Enhancements**:

- Add Foursquare-specific scoring metrics (popularity, engagement)
- Implement source attribution in confidence calculations
- Maintain existing 95% email accuracy standards

### Acceptance Criteria

1. **Cost Optimization**: Achieve 60%+ cost reduction on discovery operations
2. **Data Quality**: Maintain 95%+ email accuracy with enhanced engagement metrics
3. **Performance**: <200ms additional latency for dual-source searches
4. **Reliability**: Graceful fallback when either API is unavailable
5. **User Experience**: Transparent integration - no frontend changes required

## Epic Metadata

- Priority: High
- Phase: `
- Story Points: na
- Labels: epic, roadmap, na

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Tests passing
- [ ] Docs updated
- [ ] Deployed to production
