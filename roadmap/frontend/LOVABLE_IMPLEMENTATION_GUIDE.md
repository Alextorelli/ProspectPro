# 💎 Lovable-Specific Implementation Guide

## 🚀 **Immediate Start: Day 1 Implementation**

### **1. Project Initialization (15 minutes)**

```bash
# Create new Lovable project
lovable create prospect-pro-frontend
cd prospect-pro-frontend

# Install additional dependencies
npm install @supabase/supabase-js
npm install zustand
npm install @tanstack/react-query
npm install recharts
npm install react-hot-toast
```

### **2. Environment Setup**

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Security Note**: Never commit `.env*` files. Rotate API keys periodically. Get your actual anon key from [Supabase Dashboard](https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api)

---

## 🔧 **Lovable-Optimized Project Structure**

### **File Organization (Lovable Best Practices)**

```
src/
├── app/                    # Core app configuration
│   ├── layout.tsx             # Root layout component
│   ├── globals.css            # Global styles with Tailwind
│   └── providers.tsx          # React Query & Toast providers
├── components/            # Feature-based components
│   ├── discovery/            # Business discovery feature
│   │   ├── DiscoveryForm.tsx
│   │   ├── DiscoveryResults.tsx
│   │   └── BudgetTracker.tsx
│   ├── dashboard/           # Campaign dashboard
│   │   ├── CampaignOverview.tsx
│   │   ├── LeadMetrics.tsx
│   │   └── CostAnalytics.tsx
│   ├── leads/              # Lead management
│   │   ├── LeadCard.tsx
│   │   ├── LeadTable.tsx
│   │   └── LeadExport.tsx
│   └── ui/                 # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── ProgressBar.tsx
├── lib/                   # Utilities and configs
│   ├── supabase.ts           # Supabase client config
│   ├── api.ts               # API helper functions
│   ├── stores.ts            # Zustand stores
│   └── utils.ts             # Helper utilities
├── pages/                 # Route pages
│   ├── index.tsx             # Landing/Dashboard
│   ├── discovery.tsx         # Business discovery page
│   ├── campaign/            # Campaign details
│   │   └── [id].tsx
│   └── results.tsx          # Search results page
└── types/                 # TypeScript definitions
    ├── api.ts               # API response types
    ├── campaign.ts          # Campaign types
    └── lead.ts              # Lead types
```

---

## ⚙️ **Core Configuration Files**

### **1. Supabase Client (`src/lib/supabase.ts`)**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No auth required for ProspectPro
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit for cost control
    },
  },
});

// Health check function
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.functions.invoke("system-health");
    return error ? false : data?.status === "healthy";
  } catch {
    return false;
  }
};
```

### **2. API Layer (`src/lib/api.ts`)**

```typescript
import { supabase } from "./supabase";
import type {
  DiscoveryRequest,
  Campaign,
  Lead,
  ExportRequest,
} from "@/types/api";

class ProspectProAPI {
  // Business Discovery
  async startDiscovery(params: DiscoveryRequest): Promise<Campaign> {
    const { data, error } = await supabase.functions.invoke(
      "enhanced-business-discovery",
      { body: params }
    );

    if (error) throw new APIError(error.message, "DISCOVERY_FAILED");
    return data;
  }

  // Get campaign leads
  async getCampaignLeads(campaignId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from("enhanced_leads")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("confidence_score", { ascending: false });

    if (error) throw new APIError(error.message, "LEADS_FETCH_FAILED");
    return data;
  }

  // Export campaign
  async exportCampaign(
    request: ExportRequest
  ): Promise<{ downloadUrl: string; filename: string }> {
    const { data, error } = await supabase.functions.invoke("export-campaign", {
      body: request,
    });

    if (error) throw new APIError(error.message, "EXPORT_FAILED");
    return data;
  }

  // Get campaign details
  async getCampaign(campaignId: string): Promise<Campaign> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) throw new APIError(error.message, "CAMPAIGN_FETCH_FAILED");
    return data;
  }
}

// Error handling
export class APIError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "APIError";
  }
}

export const api = new ProspectProAPI();
```

### **3. State Management (`src/lib/stores.ts`)**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Campaign, Lead, DiscoveryProgress } from "@/types";

// Campaign store - session based
interface CampaignStore {
  activeCampaign: Campaign | null;
  leads: Lead[];
  progress: DiscoveryProgress | null;
  selectedLeads: string[];
  isProcessing: boolean;

  setActiveCampaign: (campaign: Campaign) => void;
  addLead: (lead: Lead) => void;
  updateLeads: (leads: Lead[]) => void;
  setProgress: (progress: DiscoveryProgress) => void;
  toggleLeadSelection: (leadId: string) => void;
  clearSelection: () => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  activeCampaign: null,
  leads: [],
  progress: null,
  selectedLeads: [],
  isProcessing: false,

  setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),

  addLead: (lead) =>
    set((state) => ({
      leads: [...state.leads, lead],
    })),

  updateLeads: (leads) => set({ leads }),

  setProgress: (progress) => set({ progress }),

  toggleLeadSelection: (leadId) =>
    set((state) => ({
      selectedLeads: state.selectedLeads.includes(leadId)
        ? state.selectedLeads.filter((id) => id !== leadId)
        : [...state.selectedLeads, leadId],
    })),

  clearSelection: () => set({ selectedLeads: [] }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  reset: () =>
    set({
      activeCampaign: null,
      leads: [],
      progress: null,
      selectedLeads: [],
      isProcessing: false,
    }),
}));

// User preferences store - persistent
interface UserStore {
  budgetPreference: number;
  exportFormat: "csv" | "json" | "excel";
  dashboardLayout: "grid" | "list";

  setBudgetPreference: (budget: number) => void;
  setExportFormat: (format: "csv" | "json" | "excel") => void;
  setDashboardLayout: (layout: "grid" | "list") => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      budgetPreference: 25,
      exportFormat: "csv",
      dashboardLayout: "grid",

      setBudgetPreference: (budgetPreference) => set({ budgetPreference }),
      setExportFormat: (exportFormat) => set({ exportFormat }),
      setDashboardLayout: (dashboardLayout) => set({ dashboardLayout }),
    }),
    {
      name: "prospect-pro-user-preferences",
    }
  )
);
```

### **4. React Query Setup (`src/app/providers.tsx`)**

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // Don't retry on budget exceeded or quota exceeded
              if (
                error?.code === "BUDGET_EXCEEDED" ||
                error?.code === "QUOTA_EXCEEDED"
              ) {
                return false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
```

---

## 🎯 **Key Custom Hooks**

### **1. Business Discovery Hook (`src/hooks/useBusinessDiscovery.ts`)**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores";
import toast from "react-hot-toast";
import type { DiscoveryRequest } from "@/types/api";

export const useBusinessDiscovery = () => {
  const queryClient = useQueryClient();
  const { setActiveCampaign, setProcessing, reset } = useCampaignStore();

  const discoveryMutation = useMutation({
    mutationFn: (params: DiscoveryRequest) => api.startDiscovery(params),

    onMutate: () => {
      reset();
      setProcessing(true);
      toast.loading("Starting business discovery...", { id: "discovery" });
    },

    onSuccess: (campaign) => {
      setActiveCampaign(campaign);
      toast.success("Discovery started successfully!", { id: "discovery" });

      // Invalidate campaigns list
      queryClient.invalidateQueries(["campaigns"]);
    },

    onError: (error: any) => {
      console.error("Discovery failed:", error);
      toast.error(error.message || "Discovery failed", { id: "discovery" });
    },

    onSettled: () => {
      setProcessing(false);
    },
  });

  return {
    startDiscovery: discoveryMutation.mutate,
    isStarting: discoveryMutation.isLoading,
    error: discoveryMutation.error,
  };
};
```

### **2. Real-time Updates Hook (`src/hooks/useRealTimeUpdates.ts`)**

```typescript
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCampaignStore } from "@/lib/stores";
import type { Lead } from "@/types";

export const useRealTimeUpdates = (campaignId: string | null) => {
  const queryClient = useQueryClient();
  const { addLead, setProgress } = useCampaignStore();

  useEffect(() => {
    if (!campaignId) return;

    // Subscribe to lead updates
    const leadsSubscription = supabase
      .channel(`campaign-leads-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "enhanced_leads",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const newLead = payload.new as Lead;
          addLead(newLead);

          // Update React Query cache
          queryClient.setQueryData(
            ["leads", campaignId],
            (oldData: Lead[] | undefined) => {
              return oldData ? [...oldData, newLead] : [newLead];
            }
          );
        }
      )
      .subscribe();

    // Subscribe to campaign status updates
    const campaignSubscription = supabase
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
          // Invalidate campaign query to refetch latest data
          queryClient.invalidateQueries(["campaign", campaignId]);

          // Update progress if available
          const campaign = payload.new as any;
          if (campaign.metadata?.progress) {
            setProgress(campaign.metadata.progress);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsSubscription);
      supabase.removeChannel(campaignSubscription);
    };
  }, [campaignId, addLead, setProgress, queryClient]);
};
```

### **3. Cost Tracking Hook (`src/hooks/useCostTracking.ts`)**

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const useCostTracking = (campaignId: string | null) => {
  const [realTimeCost, setRealTimeCost] = useState(0);

  // Fetch initial costs
  const { data: costs = [] } = useQuery(
    ["costs", campaignId],
    async () => {
      if (!campaignId) return [];

      const { data, error } = await supabase
        .from("api_costs")
        .select("*")
        .eq("campaign_id", campaignId);

      if (error) throw error;
      return data;
    },
    {
      enabled: !!campaignId,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Real-time cost updates
  useEffect(() => {
    if (!campaignId) return;

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
        (payload) => {
          const newCost = payload.new as any;
          setRealTimeCost((prev) => prev + newCost.cost_amount);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [campaignId]);

  const totalCost =
    costs.reduce((sum, cost) => sum + cost.cost_amount, 0) + realTimeCost;

  const apiBreakdown = costs.reduce((acc, cost) => {
    acc[cost.api_name] = (acc[cost.api_name] || 0) + cost.cost_amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCost,
    apiBreakdown,
    costs,
  };
};
```

---

## 🎨 **Core UI Components**

### **1. Business Discovery Form (`src/components/discovery/DiscoveryForm.tsx`)**

```tsx
"use client";

import { useState } from "react";
import { useBusinessDiscovery } from "@/hooks/useBusinessDiscovery";
import { useUserStore } from "@/lib/stores";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function DiscoveryForm() {
  const { startDiscovery, isStarting } = useBusinessDiscovery();
  const { budgetPreference, setBudgetPreference } = useUserStore();

  const [formData, setFormData] = useState({
    businessType: "",
    location: "",
    businessCount: 50,
    budgetLimit: budgetPreference,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save budget preference
    setBudgetPreference(formData.budgetLimit);

    startDiscovery(formData);
  };

  return (
    <Card className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Start Business Discovery
          </h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type
          </label>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25 businesses</option>
            <option value={50}>50 businesses</option>
            <option value={100}>100 businesses</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Limit
          </label>
          <select
            value={formData.budgetLimit}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                budgetLimit: parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>$10 - Basic search</option>
            <option value={25}>$25 - Enhanced search</option>
            <option value={50}>$50 - Premium search</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            Estimated cost: ~$0.50 per qualified lead
          </p>
        </div>

        <Button
          type="submit"
          disabled={
            isStarting ||
            !formData.businessType.trim() ||
            !formData.location.trim()
          }
          className="w-full"
          loading={isStarting}
        >
          {isStarting ? "Starting Discovery..." : "Start Business Discovery"}
        </Button>
      </form>
    </Card>
  );
}
```

### **2. Campaign Dashboard (`src/components/dashboard/CampaignOverview.tsx`)**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCampaignStore } from "@/lib/stores";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useCostTracking } from "@/hooks/useCostTracking";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LeadMetrics } from "./LeadMetrics";
import { CostAnalytics } from "./CostAnalytics";

interface Props {
  campaignId: string;
}

export function CampaignOverview({ campaignId }: Props) {
  const { leads, progress } = useCampaignStore();
  const { totalCost, apiBreakdown } = useCostTracking(campaignId);

  // Set up real-time updates
  useRealTimeUpdates(campaignId);

  // Fetch campaign details
  const { data: campaign, isLoading } = useQuery(
    ["campaign", campaignId],
    () => api.getCampaign(campaignId),
    {
      refetchInterval: 10000, // Refetch every 10 seconds during processing
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">Campaign not found</p>
      </Card>
    );
  }

  const isProcessing = campaign.status === "processing";
  const qualifiedLeads = leads.filter((lead) => lead.is_qualified);
  const avgConfidence =
    leads.length > 0
      ? leads.reduce((sum, lead) => sum + lead.confidence_score, 0) /
        leads.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {campaign.business_type} in {campaign.location}
            </h1>
            <p className="text-gray-600 mt-1">
              Started {new Date(campaign.started_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : campaign.status === "processing"
                  ? "bg-blue-100 text-blue-800"
                  : campaign.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {campaign.status.charAt(0).toUpperCase() +
                campaign.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Progress Indicator */}
        {isProcessing && progress && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {progress.currentStage} ({progress.completedSteps}/
                {progress.totalSteps})
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(progress.percentage)}% complete
              </span>
            </div>
            <ProgressBar
              value={progress.percentage}
              max={100}
              className="h-2"
            />
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            <p className="text-sm text-gray-600">Total Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {qualifiedLeads.length}
            </p>
            <p className="text-sm text-gray-600">Qualified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {avgConfidence.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Avg Confidence</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              ${totalCost.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Total Cost</p>
          </div>
        </div>
      </Card>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadMetrics leads={leads} />
        <CostAnalytics
          totalCost={totalCost}
          budgetLimit={campaign.budget_limit}
          apiBreakdown={apiBreakdown}
        />
      </div>
    </div>
  );
}
```

### **3. Lead Table Component (`src/components/leads/LeadTable.tsx`)**

```tsx
"use client";

import { useState } from "react";
import { useCampaignStore } from "@/lib/stores";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ExportModal } from "./ExportModal";
import type { Lead } from "@/types";

interface Props {
  leads: Lead[];
}

export function LeadTable({ leads }: Props) {
  const { selectedLeads, toggleLeadSelection, clearSelection } =
    useCampaignStore();
  const [showExportModal, setShowExportModal] = useState(false);

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      clearSelection();
    } else {
      leads.forEach((lead) => {
        if (!selectedLeads.includes(lead.id)) {
          toggleLeadSelection(lead.id);
        }
      });
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Discovered Leads ({leads.length})
          </h3>
          <div className="flex items-center gap-4">
            {selectedLeads.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedLeads.length} selected
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
              disabled={leads.length === 0}
            >
              {selectedLeads.length === leads.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              onClick={() => setShowExportModal(true)}
              disabled={selectedLeads.length === 0}
            >
              Export Selected
            </Button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedLeads.length === leads.length && leads.length > 0
                  }
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => toggleLeadSelection(lead.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {lead.business_name}
                    </div>
                    {lead.address && (
                      <div className="text-sm text-gray-500">
                        {lead.address}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 space-y-1">
                    {lead.phone && <div>📞 {lead.phone}</div>}
                    {lead.email && <div>✉️ {lead.email}</div>}
                    {lead.website && (
                      <div>
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          🌐 Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(
                      lead.confidence_score
                    )}`}
                  >
                    {lead.confidence_score}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      lead.is_qualified
                        ? "text-green-800 bg-green-100"
                        : "text-gray-800 bg-gray-100"
                    }`}
                  >
                    {lead.is_qualified ? "Qualified" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {leads.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl mb-2">🔍</div>
          <p className="text-gray-600">No leads found yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Leads will appear here as they are discovered
          </p>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          selectedLeads={selectedLeads}
        />
      )}
    </div>
  );
}
```

---

## 🚀 **Deployment Instructions**

### **1. Build & Deploy to Lovable**

```bash
# Build the application
npm run build

# Deploy to Lovable (production)
lovable deploy --production

# Deploy to Lovable (staging)
lovable deploy --staging
```

### **2. Environment Configuration**

Production `.env.production`:

```bash
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key_here
VITE_ENVIRONMENT=production
```

### **3. Post-Deployment Checklist**

- [ ] **Supabase Connection**: Test connection to production database
- [ ] **Real-time Updates**: Verify real-time subscriptions work
- [ ] **Edge Functions**: Test all API endpoints
- [ ] **Export Functionality**: Test CSV/JSON/Excel exports
- [ ] **Cost Tracking**: Verify budget tracking works
- [ ] **Error Handling**: Test error scenarios
- [ ] **Performance**: Check Core Web Vitals
- [ ] **Mobile Responsiveness**: Test on mobile devices

---

## 🎯 **7-Day Fast Track Implementation**

### **Daily Sprint Goals**

**Day 1: Foundation**

- [ ] Project scaffold with TypeScript + Supabase client
- [ ] Environment setup + providers (React Query, Toast)
- [ ] Health check smoke test + error boundaries

**Day 2: Discovery Core**

- [ ] Business discovery form with validation
- [ ] startDiscovery mutation with toast feedback
- [ ] Basic routing structure (Dashboard → Discovery → Results)

**Day 3: Real-Time Pipeline**

- [ ] Single multiplexed realtime channel setup
- [ ] Batched UI updates for lead insertions
- [ ] Campaign status tracking with progress indicators

**Day 4: Dashboard & Analytics**

- [ ] Campaign overview with hero cards (Total, Qualified, Cost, Confidence)
- [ ] Cost tracker with budget gauge and API breakdown
- [ ] Lead funnel visualization

**Day 5: Lead Management**

- [ ] Lead table with sticky headers and confidence chips
- [ ] Optimistic selection with bulk operations
- [ ] Export preview modal with format selection

**Day 6: Cost Optimization**

- [ ] Verify-on-Export flow with cost projection
- [ ] Budget guardrails and projected cost warnings
- [ ] Column projection + pagination for efficiency

**Day 7: Polish & Deploy**

- [ ] Loading skeletons and empty states
- [ ] Dark mode support and accessibility improvements
- [ ] Production build and Lovable deployment

### **UI Enhancement Checklist**

- [ ] **Visual Hierarchy**: Consistent hero cards, colored confidence chips
- [ ] **Real-Time Feedback**: Toast notifications, progress animations
- [ ] **Cost Transparency**: Budget gauge with "X of Y used" labels
- [ ] **User Experience**: Sticky headers, density toggle, keyboard navigation
- [ ] **Performance**: Query pagination, realtime batching, idle mode
- [ ] **Accessibility**: WCAG AA contrast, focus rings, dark mode

### **Performance Defaults**

```typescript
// React Query configuration for efficiency
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false, // Disable background refetch on completion
    },
  },
});

// Confidence chip color helper
const clsForConfidence = (score: number) =>
  score >= 80
    ? "bg-green-50 text-green-700 ring-green-200"
    : score >= 60
    ? "bg-amber-50 text-amber-700 ring-amber-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
```

**7-day delivery with production-ready quality and cost optimization!** 🚀
