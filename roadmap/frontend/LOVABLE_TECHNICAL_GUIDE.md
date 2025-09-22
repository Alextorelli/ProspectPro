# 🔧 Lovable Technical Integration Guide

## 🎯 **Quick Start Implementation**

### **Immediate Setup (Day 1)**

#### **1. Create Lovable Project**

```bash
# Initialize new Lovable project
npx create-lovable-app prospect-pro-frontend --template typescript
cd prospect-pro-frontend

# Install ProspectPro-specific dependencies
npm install @supabase/supabase-js @tanstack/react-query zustand
npm install recharts react-hook-form react-router-dom
```

#### **2. Environment Configuration**

```env
# .env.local - Lovable Environment Variables
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_EDGE_FUNCTIONS_URL=https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1
VITE_APP_VERSION=2.0.0
```

#### **3. Supabase Client Setup**

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Functions helper
export const callEdgeFunction = async (functionName: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: JSON.stringify(payload),
  });
  if (error) throw error;
  return data;
};
```

---

## 🏗️ **Core Integration Points**

### **API Integration Hooks**

#### **Business Discovery Hook**

```typescript
// src/hooks/useBusinessDiscovery.ts
import { useMutation } from "@tanstack/react-query";
import { callEdgeFunction } from "../lib/supabase";

export const useBusinessDiscovery = () => {
  return useMutation({
    mutationFn: async (searchParams: SearchParams) => {
      return callEdgeFunction("enhanced-business-discovery", {
        businessType: searchParams.businessType,
        location: searchParams.location,
        budgetLimit: searchParams.budgetLimit,
        qualityThreshold: searchParams.qualityThreshold,
      });
    },
    onSuccess: (data) => {
      // Handle successful discovery initiation
      console.log("Discovery started:", data.campaignId);
    },
    onError: (error) => {
      console.error("Discovery failed:", error);
    },
  });
};
```

#### **Real-Time Updates Hook**

```typescript
// src/hooks/useRealTimeUpdates.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const useRealTimeUpdates = (campaignId: string) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [progress, setProgress] = useState<DiscoveryProgress>();

  useEffect(() => {
    const channel = supabase
      .channel("campaign-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enhanced_leads",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          // Handle real-time lead updates
          if (payload.eventType === "INSERT") {
            setLeads((prev) => [...prev, payload.new as Lead]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  return { leads, progress };
};
```

#### **Cost Tracking Hook**

```typescript
// src/hooks/useCostTracking.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export const useCostTracking = (campaignId?: string) => {
  return useQuery({
    queryKey: ["cost-tracking", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_costs")
        .select("*")
        .eq("campaign_id", campaignId);

      if (error) throw error;

      return {
        totalCost: data.reduce((sum, cost) => sum + cost.cost_usd, 0),
        apiBreakdown: data.reduce((acc, cost) => {
          acc[cost.api_service] = (acc[cost.api_service] || 0) + cost.cost_usd;
          return acc;
        }, {} as Record<string, number>),
      };
    },
    enabled: !!campaignId,
    refetchInterval: 5000, // Update every 5 seconds during active campaigns
  });
};
```

---

## 🎨 **Component Implementation**

### **Campaign Dashboard Component**

```typescript
// src/components/CampaignDashboard.tsx
import React from "react";
import { useCostTracking } from "../hooks/useCostTracking";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";

interface CampaignDashboardProps {
  campaignId: string;
}

export const CampaignDashboard: React.FC<CampaignDashboardProps> = ({
  campaignId,
}) => {
  const { data: costData } = useCostTracking(campaignId);
  const { leads, progress } = useRealTimeUpdates(campaignId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cost Tracking Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Campaign Costs</h3>
        <div className="text-2xl font-bold text-blue-600">
          ${costData?.totalCost.toFixed(2) || "0.00"}
        </div>
        <div className="text-sm text-gray-500">
          {leads.length} leads discovered
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Discovery Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Google Places Search</span>
            <span className="text-green-600">✓ Complete</span>
          </div>
          <div className="flex justify-between">
            <span>Email Discovery</span>
            <span className="text-blue-600">In Progress</span>
          </div>
        </div>
      </div>

      {/* Lead Quality Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quality Metrics</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Avg Confidence</span>
            <span className="font-semibold">
              {leads.length
                ? Math.round(
                    leads.reduce(
                      (sum, lead) => sum + lead.confidence_score,
                      0
                    ) / leads.length
                  )
                : 0}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### **Business Discovery Form**

```typescript
// src/components/BusinessDiscoveryForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { useBusinessDiscovery } from "../hooks/useBusinessDiscovery";

interface SearchFormData {
  businessType: string;
  location: string;
  budgetLimit: number;
  qualityThreshold: number;
}

export const BusinessDiscoveryForm: React.FC = () => {
  const { register, handleSubmit, watch } = useForm<SearchFormData>();
  const discovery = useBusinessDiscovery();
  const budgetLimit = watch("budgetLimit", 50);

  const onSubmit = (data: SearchFormData) => {
    discovery.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Business Type
        </label>
        <input
          {...register("businessType", { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="e.g., Digital Marketing Agency"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          {...register("location", { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="e.g., San Francisco, CA"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Budget Limit: ${budgetLimit}
        </label>
        <input
          type="range"
          {...register("budgetLimit")}
          min="10"
          max="500"
          step="10"
          className="mt-1 block w-full"
        />
        <div className="text-sm text-gray-500">
          Estimated leads: {Math.round(budgetLimit / 0.35)} -{" "}
          {Math.round(budgetLimit / 0.25)}
        </div>
      </div>

      <button
        type="submit"
        disabled={discovery.isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {discovery.isPending ? "Starting Discovery..." : "Start Lead Discovery"}
      </button>
    </form>
  );
};
```

---

## 📊 **State Management Setup**

### **Campaign Store (Zustand)**

```typescript
// src/stores/campaignStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CampaignState {
  activeCampaign: Campaign | null;
  leads: Lead[];
  totalCost: number;
  budgetLimit: number;
  progress: DiscoveryProgress;

  // Actions
  startCampaign: (campaign: Campaign) => void;
  addLead: (lead: Lead) => void;
  updateCost: (cost: number) => void;
  updateProgress: (progress: DiscoveryProgress) => void;
  exportLeads: (format: "csv" | "json") => void;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      activeCampaign: null,
      leads: [],
      totalCost: 0,
      budgetLimit: 100,
      progress: { stage: "idle", completed: 0, total: 0 },

      startCampaign: (campaign) =>
        set({
          activeCampaign: campaign,
          leads: [],
          totalCost: 0,
          progress: { stage: "discovery", completed: 0, total: 100 },
        }),

      addLead: (lead) =>
        set((state) => ({
          leads: [...state.leads, lead],
        })),

      updateCost: (additionalCost) =>
        set((state) => ({
          totalCost: state.totalCost + additionalCost,
        })),

      updateProgress: (progress) => set({ progress }),

      exportLeads: (format) => {
        const { leads } = get();
        const qualifiedLeads = leads.filter(
          (lead) => lead.confidence_score >= 70
        );

        if (format === "csv") {
          // Generate CSV export
          const csv = convertToCSV(qualifiedLeads);
          downloadFile(csv, "prospect-pro-leads.csv", "text/csv");
        } else {
          // Generate JSON export
          downloadFile(
            JSON.stringify(qualifiedLeads, null, 2),
            "prospect-pro-leads.json",
            "application/json"
          );
        }
      },
    }),
    {
      name: "campaign-store",
      partialize: (state) => ({
        budgetLimit: state.budgetLimit,
        // Don't persist active campaigns or leads
      }),
    }
  )
);
```

---

## 🔌 **Webhook Integration**

### **Real-Time Event Handler**

```typescript
// src/utils/webhookHandler.ts
import { useCampaignStore } from "../stores/campaignStore";

export const handleWebhookEvent = (event: WebhookEvent) => {
  const store = useCampaignStore.getState();

  switch (event.type) {
    case "lead.discovered":
      store.addLead(event.data.lead);
      break;

    case "cost.updated":
      store.updateCost(event.data.cost);
      break;

    case "progress.updated":
      store.updateProgress(event.data.progress);
      break;

    case "campaign.completed":
      store.updateProgress({ stage: "completed", completed: 100, total: 100 });
      break;

    default:
      console.log("Unknown webhook event:", event.type);
  }
};
```

---

## 🎯 **Deployment Configuration**

### **Lovable Production Build**

```json
{
  "scripts": {
    "build": "vite build --mode production",
    "preview": "vite preview",
    "deploy": "npm run build && lovable deploy"
  },
  "build": {
    "outDir": "dist",
    "sourcemap": false,
    "minify": true
  }
}
```

### **Environment Variables (Production)**

```env
# Production Environment
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=production_anon_key
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

---

## ✅ **Ready-to-Use API Endpoints**

### **Available Backend APIs**

- `POST /api/business-discovery` - Initiate lead discovery
- `GET /api/dashboard-metrics` - Get campaign analytics
- `GET /api/campaigns/:id/leads` - Retrieve campaign leads
- `GET /api/health` - System health check
- `POST /api/campaigns/:id/export` - Export campaign results

### **Edge Functions (Already Deployed)**

- `enhanced-business-discovery` - 4-stage pipeline
- `lead-validation-edge` - Individual validation
- `business-discovery-edge` - Basic search
- `diag` - System diagnostics

### **Real-Time Subscriptions**

- `enhanced_leads` table changes
- `api_costs` table updates
- `campaigns` table status changes

---

## 🚀 **Implementation Checklist**

### **Day 1 - Foundation**

- [ ] Create Lovable project with TypeScript
- [ ] Install Supabase and React Query
- [ ] Configure environment variables
- [ ] Set up basic routing structure
- [ ] Test API connectivity

### **Day 2-3 - Core Features**

- [ ] Implement business discovery form
- [ ] Add real-time updates hook
- [ ] Create campaign dashboard
- [ ] Set up state management
- [ ] Test webhook integration

### **Day 4-5 - Polish & Deploy**

- [ ] Add export functionality
- [ ] Implement cost tracking display
- [ ] Add loading states and error handling
- [ ] Optimize performance
- [ ] Deploy to Lovable production

**The backend is production-ready. Frontend implementation can start immediately with full API compatibility!** 🎯
