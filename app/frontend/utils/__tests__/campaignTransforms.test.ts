import { afterEach, describe, expect, it, vi } from "vitest";
import { transformCampaignData } from "../campaignTransforms";

describe("transformCampaignData", () => {
  const baseCampaign = {
    id: "cmp_test",
    status: null,
    business_type: "Coffee Shops",
    location: "Seattle, WA",
    results_count: "9",
    total_cost: "15.5",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:10:00.000Z",
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes campaign status, metrics, and lead enrichment", () => {
    const { campaignResult, leads } = transformCampaignData(
      baseCampaign,
      [
        {
          id: "lead_1",
          campaign_id: "cmp_test",
          business_name: "Seattle Coffee",
          confidence_score: "82",
          validation_status: "pending",
          created_at: "2024-01-01T00:05:00.000Z",
          enrichment_data: {
            validationStatus: "validated",
            verificationSources: ["hunter_directory"],
            processingMetadata: {
              servicesUsed: ["hunter"],
              totalCost: "4.25",
              enrichmentTier: "enterprise",
            },
          },
        },
      ],
      {
        metrics: {
          total_cost: "18.25",
          tier_name: "premium",
        },
      }
    );

    expect(campaignResult.status).toBe("completed");
    expect(campaignResult.total_cost).toBe(15.5);
    expect(campaignResult.leads_found).toBe(9);
    expect(campaignResult.leads_validated).toBe(1);
    expect(campaignResult.tier_used).toBe("premium");

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      id: "lead_1",
      business_name: "Seattle Coffee",
      validation_status: "validated",
      cost_to_acquire: 4.25,
      enrichment_tier: "enterprise",
      data_sources: ["hunter", "hunter_directory"],
    });
  });

  it("provides safe defaults when enrichment data is missing", () => {
    const { campaignResult, leads } = transformCampaignData(
      {
        ...baseCampaign,
        id: "cmp_default",
        status: "running",
        results_count: null,
        total_cost: null,
      },
      [
        {
          id: "lead_2",
          campaign_id: null,
          business_name: "Fallback Business",
          confidence_score: 64,
        },
      ]
    );

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      id: "lead_2",
      campaign_id: "cmp_default",
      data_sources: ["google_places"],
      validation_status: "validated",
      cost_to_acquire: 0,
      confidence_score: 64,
    });
    expect(campaignResult.leads_found).toBe(1);
    expect(campaignResult.leads_qualified).toBe(0);
    expect(campaignResult.status).toBe("running");
  });

  it("drops leads that do not have an identifier", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = transformCampaignData(baseCampaign, [
      { business_name: "Missing Id", confidence_score: 88 },
      {
        id: "lead_valid",
        campaign_id: "cmp_test",
        business_name: "Valid Lead",
        confidence_score: 72,
      },
    ]);

    expect(result.leads).toHaveLength(1);
    expect(result.leads[0].id).toBe("lead_valid");
    expect(warnSpy).toHaveBeenCalled();
  });
});
