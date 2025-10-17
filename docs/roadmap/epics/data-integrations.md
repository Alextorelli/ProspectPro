# 🔌 Epic: Data Source Integrations Platform

## Problem Statement

ProspectPro needs a standardized way to add and manage multiple data providers while tracking per-call costs and enforcing budget controls.

## Solution

Implement a DataSource factory pattern with provider modules (Hunter, Apollo, Google), cost tracking, rate limiting, and circuit breakers. FINRA is a subtask as a premium provider.

## Acceptance Criteria

- [ ] DataSource interface and factory implemented
- [ ] Providers: Hunter, Apollo, Google complete
- [ ] Cost tracking with Supabase logs
- [ ] Rate limiting + circuit breakers
- [ ] FINRA provider (subtask) with OAuth and endpoints
- [ ] Tests and documentation added

## Business Impact

- Faster integration of new sources
- Lower per-lead costs through optimal provider selection
- Enables premium FINRA tier

## Technical Requirements

- TypeScript interfaces under lib/integrations
- Supabase tables for cost and usage logs
- Reusable error handling and retry logic

## Subtask: FINRA Integration

- OAuth 2.0 auth
- Individual advisor verification
- Firm search and regulatory actions
- Cost tracking ($0.001/call, markup $25-$200)

## Metadata

- Priority: High
- Phase: Q1 2026
- Story Points: 21
- Labels: epic, roadmap, data-integration
