# 🔌 ProspectPro API Integration Reference

## 📋 **Quick Reference**

### **Base Configuration**

```typescript
const supabaseUrl = "https://sriycekxdqnesdsgwiuc.supabase.co";
const supabaseAnonKey = "your_anon_key_here";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 🚀 **Edge Functions API**

### **1. Business Discovery**

**Endpoint:** `enhanced-business-discovery`

```typescript
interface DiscoveryRequest {
  businessType: string;
  location: string;
  businessCount?: number;
  budgetLimit?: number;
}

interface DiscoveryResponse {
  campaignId: string;
  message: string;
  estimatedCost: number;
  processingTime: string;
}

// Usage
const startDiscovery = async (params: DiscoveryRequest) => {
  const { data, error } = await supabase.functions.invoke(
    "enhanced-business-discovery",
    { body: params }
  );

  if (error) throw new Error(error.message);
  return data;
};
```

### **2. Campaign Export (with Verify-on-Export)**

**Endpoint:** `export-campaign`

```typescript
interface ExportRequest {
  campaignId: string;
  format: "csv" | "json" | "excel";
  includeAnalysis?: boolean;
  verifyOnExport?: boolean; // Only verify selected leads at export time
  selectedLeadIds?: string[]; // Specific leads to export
}

interface ExportResponse {
  downloadUrl: string;
  filename: string;
  recordCount: number;
  verificationCost?: number; // Cost for verify-on-export if applicable
  estimatedTime?: string; // Processing time for verification
}

// Standard export
const exportCampaign = async (request: ExportRequest) => {
  const { data, error } = await supabase.functions.invoke("export-campaign", {
    body: request,
  });

  if (error) throw new Error(error.message);
  return data;
};

// Verify-on-Export with cost projection
const exportWithVerification = async (
  campaignId: string,
  selectedLeads: string[]
) => {
  // First get cost estimate
  const { data: estimate } = await supabase.functions.invoke(
    "estimate-verification",
    {
      body: { campaignId, leadIds: selectedLeads },
    }
  );

  if (estimate.projectedCost > 5) {
    // Show warning for >$5 verification
    const confirmed = confirm(
      `Verification will cost ~$${estimate.projectedCost.toFixed(2)}. Continue?`
    );
    if (!confirmed) return null;
  }

  return exportCampaign({
    campaignId,
    format: "csv",
    verifyOnExport: true,
    selectedLeadIds: selectedLeads,
  });
};
```

### **3. System Health Check**

**Endpoint:** `system-health`

```typescript
interface HealthResponse {
  status: "healthy" | "degraded" | "error";
  database: boolean;
  apis: {
    googlePlaces: boolean;
    hunterIo: boolean;
    neverBounce: boolean;
  };
  lastUpdated: string;
}

// Usage
const checkSystemHealth = async () => {
  const { data, error } = await supabase.functions.invoke("system-health");
  return error ? { status: "error", message: error.message } : data;
};
```

---

## 🗄️ **Database Tables API**

### **Enhanced Leads Table**

```typescript
interface Lead {
  id: string;
  campaign_id: string;
  business_name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  confidence_score: number;
  is_qualified: boolean;
  validation_results: ValidationResults;
  source_attribution: SourceAttribution;
  cost_attribution: CostAttribution;
  created_at: string;
  updated_at: string;
}

// Fetch leads for campaign (optimized with column projection)
const getCampaignLeads = async (
  campaignId: string,
  page = 0,
  pageSize = 50
) => {
  const { data, error } = await supabase
    .from("enhanced_leads")
    .select(
      "id,business_name,confidence_score,website,is_qualified,phone,email"
    )
    .eq("campaign_id", campaignId)
    .order("confidence_score", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (error) throw new Error(error.message);
  return data;
};

// Get full lead details (when needed)
const getLeadDetails = async (leadId: string) => {
  const { data, error } = await supabase
    .from("enhanced_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Get lead count by confidence
const getLeadStats = async (campaignId: string) => {
  const { data, error } = await supabase
    .from("enhanced_leads")
    .select("confidence_score, is_qualified")
    .eq("campaign_id", campaignId);

  if (error) throw new Error(error.message);

  return {
    total: data.length,
    qualified: data.filter((l) => l.is_qualified).length,
    highConfidence: data.filter((l) => l.confidence_score >= 80).length,
    avgConfidence:
      data.reduce((sum, l) => sum + l.confidence_score, 0) / data.length,
  };
};
```

### **Campaigns Table**

```typescript
interface Campaign {
  id: string;
  user_id: string;
  business_type: string;
  location: string;
  business_count: number;
  budget_limit: number;
  total_cost: number;
  status: "pending" | "processing" | "completed" | "failed";
  leads_found: number;
  qualified_leads: number;
  started_at: string;
  completed_at?: string;
  metadata: CampaignMetadata;
}

// Get all user campaigns for the main dashboard
const getAllCampaigns = async () => {
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, business_type, location, status, leads_found, total_cost, started_at"
    )
    .order("started_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// Get full campaign details for the campaign view
const getCampaignDetails = async (campaignId: string) => {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};
```

### **API Costs Table**

```typescript
interface ApiCost {
  id: string;
  campaign_id: string;
  api_name: string;
  operation_type: string;
  cost_amount: number;
  request_count: number;
  timestamp: string;
}

// Get campaign costs
const getCampaignCosts = async (campaignId: string) => {
  const { data, error } = await supabase
    .from("api_costs")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("timestamp", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// Get cost summary
const getCostSummary = async (campaignId: string) => {
  const { data, error } = await supabase.rpc("get_campaign_cost_summary", {
    p_campaign_id: campaignId,
  });

  if (error) throw new Error(error.message);
  return data;
};
```

---

## 🔄 **Real-Time Subscriptions (Optimized)**

### **Single Multiplexed Channel Pattern**

```typescript
const useRealTimeUpdates = (campaignId: string) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  // Batched update queue for performance
  const queue = useRef<any[]>([]);
  const rafRef = useRef<number>(0);

  const flushUpdates = useCallback(() => {
    if (queue.current.length > 0) {
      setLeads(prev => [...prev, ...queue.current]);
      queue.current = [];
    }
    rafRef.current = 0;
  }, []);

  const enqueueUpdate = useCallback((item: any) => {
    queue.current.push(item);
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushUpdates);
    }
  }, [flushUpdates]);

  useEffect(() => {
    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'enhanced_leads',
        filter: `campaign_id=eq.${campaignId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          enqueueUpdate(payload.new as Lead);
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(lead =>
            lead.id === payload.new.id ? payload.new as Lead : lead
          ));
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'campaigns',
        filter: `id=eq.${campaignId}`
      }, (payload) => {
        setCampaign(payload.new as Campaign);
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'api_costs',
        filter: `campaign_id=eq.${campaignId}`
      }, (payload) => {
        const cost = payload.new as any;
        setTotalCost(prev => prev + cost.cost_amount);
      })
      .subscribe();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      supabase.removeChannel(channel);
    };
  }, [campaignId, enqueueUpdate]);

  return { leads, campaign, totalCost };
};
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [campaignId]);

  return leads;
};
```

### **Campaign Status Subscription**

```typescript
const useCampaignStatus = (campaignId: string) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const subscription = supabase
      .channel(`campaign-status-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          setCampaign(payload.new as Campaign);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [campaignId]);

  return campaign;
};
```

### **Cost Tracking Subscription**

```typescript
const useCostTracking = (campaignId: string) => {
  const [totalCost, setTotalCost] = useState(0);
  const [apiBreakdown, setApiBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    const subscription = supabase
      .channel(`costs-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "api_costs",
          filter: `campaign_id=eq.${campaignId}`,
        },
        async (payload) => {
          // Recalculate total cost
          const { data } = await supabase.rpc("get_campaign_total_cost", {
            p_campaign_id: campaignId,
          });

          setTotalCost(data || 0);

          // Update API breakdown
          const newCost = payload.new as ApiCost;
          setApiBreakdown((prev) => ({
            ...prev,
            [newCost.api_name]:
              (prev[newCost.api_name] || 0) + newCost.cost_amount,
          }));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [campaignId]);

  return { totalCost, apiBreakdown };
};
```

---

## 🎯 **Custom Hooks (React Query)**

### **`useCampaigns` (for Dashboard)**

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const getAllCampaigns = async () => {
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, business_type, location, status, leads_found, total_cost, started_at"
    )
    .order("started_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const useCampaigns = () => {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: getAllCampaigns,
  });
};
```

### **`useBusinessDiscovery` (Mutation)**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// ... (DiscoveryRequest interface)

const startDiscovery = async (params: DiscoveryRequest) => {
  const { data, error } = await supabase.functions.invoke(
    "enhanced-business-discovery",
    { body: params }
  );
  if (error) throw new Error(error.message);
  return data;
};

export const useBusinessDiscovery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startDiscovery,
    onSuccess: () => {
      // When a new campaign starts, invalidate the list of all campaigns
      // so the dashboard refetches and shows the new one.
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Discovery campaign started!");
    },
    onError: (error) => {
      toast.error(`Failed to start discovery: ${error.message}`);
    },
  });
};
```

### **`useExport` (Mutation with Verify-on-Export)**

```typescript
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// ... (ExportRequest interface)

const exportCampaign = async (request: ExportRequest) => {
  const { data, error } = await supabase.functions.invoke("export-campaign", {
    body: request,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const useExport = () => {
  return useMutation({
    mutationFn: exportCampaign,
    onMutate: () => {
      toast.loading("Preparing your export...", { id: "export" });
    },
    onSuccess: (data) => {
      // Trigger download
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export complete!", { id: "export" });
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`, { id: "export" });
    },
  });
};
```

---

## 🛡️ **Error Handling**

### **API Error Types**

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
}

class ProspectProError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = "ProspectProError";
  }
}

// Common error codes
const ERROR_CODES = {
  BUDGET_EXCEEDED: "BUDGET_EXCEEDED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  INVALID_PARAMS: "INVALID_PARAMS",
  API_UNAVAILABLE: "API_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;
```

### **Error Handler Hook**

```typescript
const useErrorHandler = () => {
  const handleError = (error: any) => {
    if (error instanceof ProspectProError) {
      switch (error.code) {
        case ERROR_CODES.BUDGET_EXCEEDED:
          // Show budget exceeded modal
          toast.error("Budget limit reached! Upgrade to continue.");
          break;

        case ERROR_CODES.QUOTA_EXCEEDED:
          // Show quota exceeded message
          toast.error("API quota exceeded. Try again tomorrow.");
          break;

        case ERROR_CODES.API_UNAVAILABLE:
          // Show service unavailable message
          toast.error("Service temporarily unavailable. Please try again.");
          break;

        default:
          toast.error(error.message);
      }
    } else {
      // Generic error handling
      toast.error("An unexpected error occurred.");
      console.error("Unhandled error:", error);
    }
  };

  return { handleError };
};
```

---

## 📊 **Analytics & Monitoring**

### **Event Tracking**

```typescript
interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: string;
}

const useAnalytics = () => {
  const track = (eventName: string, properties: Record<string, any> = {}) => {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      timestamp: new Date().toISOString(),
    };

    // Send to analytics service
    supabase.functions.invoke("analytics-event", { body: event });
  };

  // Campaign events
  const trackCampaignStart = (params: DiscoveryRequest) => {
    track("campaign_started", {
      businessType: params.businessType,
      location: params.location,
      budgetLimit: params.budgetLimit,
    });
  };

  const trackCampaignComplete = (campaign: Campaign, leads: Lead[]) => {
    track("campaign_completed", {
      campaignId: campaign.id,
      totalLeads: leads.length,
      qualifiedLeads: leads.filter((l) => l.is_qualified).length,
      totalCost: campaign.total_cost,
      duration: Date.now() - new Date(campaign.started_at).getTime(),
    });
  };

  return {
    track,
    trackCampaignStart,
    trackCampaignComplete,
  };
};
```

---

## 🚀 **Ready-to-Use Components**

### **Business Discovery Form**

```typescript
const BusinessDiscoveryForm = () => {
  const { startDiscovery, isProcessing } = useBusinessDiscovery();
  const { handleError } = useErrorHandler();
  const { trackCampaignStart } = useAnalytics();

  const [formData, setFormData] = useState({
    businessType: "",
    location: "",
    businessCount: 50,
    budgetLimit: 25,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      trackCampaignStart(formData);
      const campaign = await startDiscovery(formData);

      toast.success("Discovery started successfully!");

      // Redirect to campaign page
      navigate(`/campaign/${campaign.campaignId}`);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Business Type</label>
        <input
          type="text"
          value={formData.businessType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              businessType: e.target.value,
            }))
          }
          placeholder="e.g., restaurants, law firms, dentists"
          className="mt-1 block w-full rounded-md border-gray-300"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              location: e.target.value,
            }))
          }
          placeholder="e.g., San Francisco, CA"
          className="mt-1 block w-full rounded-md border-gray-300"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Number of Businesses
        </label>
        <select
          value={formData.businessCount}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              businessCount: parseInt(e.target.value),
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value={25}>25 businesses</option>
          <option value={50}>50 businesses</option>
          <option value={100}>100 businesses</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Budget Limit ($)</label>
        <select
          value={formData.budgetLimit}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              budgetLimit: parseInt(e.target.value),
            }))
          }
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value={10}>$10 - Basic search</option>
          <option value={25}>$25 - Enhanced search</option>
          <option value={50}>$50 - Premium search</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isProcessing ? "Starting Discovery..." : "Start Business Discovery"}
      </button>
    </form>
  );
};
```

### **Campaign Dashboard**

```typescript
const CampaignDashboard = ({ campaignId }: { campaignId: string }) => {
  const campaign = useCampaignStatus(campaignId);
  const leads = useLeadUpdates(campaignId);
  const { totalCost, apiBreakdown } = useCostTracking(campaignId);

  const qualifiedLeads = leads.filter((lead) => lead.is_qualified);
  const avgConfidence =
    leads.reduce((sum, lead) => sum + lead.confidence_score, 0) / leads.length;

  return (
    <div className="space-y-6">
      {/* Campaign Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Campaign Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-medium capitalize">
              {campaign?.status || "Loading..."}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Leads</p>
            <p className="text-lg font-medium">{leads.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Qualified Leads</p>
            <p className="text-lg font-medium">{qualifiedLeads.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Confidence</p>
            <p className="text-lg font-medium">{avgConfidence.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Cost Tracking */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Cost Tracking</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span>Total Cost</span>
              <span className="font-medium">${totalCost.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (totalCost / (campaign?.budget_limit || 25)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            {Object.entries(apiBreakdown).map(([api, cost]) => (
              <div key={api}>
                <p className="text-gray-600 capitalize">{api}</p>
                <p className="font-medium">${cost.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead List Preview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Leads</h2>
        <div className="space-y-3">
          {leads.slice(0, 5).map((lead) => (
            <div key={lead.id} className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{lead.business_name}</h3>
                  <p className="text-sm text-gray-600">{lead.address}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    {lead.confidence_score}% confidence
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**The API is production-ready for immediate frontend integration!** ✅
