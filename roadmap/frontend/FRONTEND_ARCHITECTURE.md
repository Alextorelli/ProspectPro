# 🏗️ ProspectPro Frontend Architecture

## 🎯 **System Overview**

### **Architecture Pattern: Event-Driven React Application**

- **Frontend**: Lovable (React 18 + TypeScript + Vite)
- **Backend**: Node.js/Express + Supabase Edge Functions
- **Real-Time**: Supabase Realtime subscriptions + Webhooks
- **State**: Zustand with persistence + React Query for server state
- **Deployment**: Static frontend + Serverless edge functions

---

## 📊 **Data Flow Architecture**

```mermaid
graph TD
    A[Lovable Frontend] -->|API Calls| B[Supabase Edge Functions]
    B -->|Process| C[Enhanced Lead Discovery]
    C -->|Store| D[Supabase Database]
    D -->|Real-time| A
    B -->|Webhooks| E[Cost Tracking]
    E -->|Update| D
    D -->|Notifications| F[Real-time Subscriptions]
    F -->|Live Updates| A
```

### **Real-Time Data Pipeline**

#### **1. Campaign Initiation**

```typescript
User Input → Business Discovery Form → Edge Function Call → Database Insert → Real-time Subscription
```

#### **2. Lead Processing**

```typescript
Edge Function → 4-Stage Pipeline → Batch Lead Insert → Real-time Updates → Frontend State Update
```

#### **3. Cost Tracking**

```typescript
API Call → Cost Calculation → Database Update → Real-time Cost Display → Budget Alerts
```

---

## 🧩 **Component Architecture**

### **Application Structure**

```
src/
├── components/              # Reusable UI components
│   ├── layout/             # Layout components
│   │   ├── AppLayout.tsx       # Main app shell
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── Header.tsx          # Top navigation bar
│   ├── forms/              # Form components
│   │   ├── BusinessDiscoveryForm.tsx
│   │   └── ExportConfigForm.tsx
│   ├── dashboard/          # Dashboard components
│   │   ├── CampaignDashboard.tsx
│   │   ├── CostTracker.tsx
│   │   └── ProgressIndicator.tsx
│   ├── results/            # Results display
│   │   ├── LeadCard.tsx
│   │   ├── LeadTable.tsx
│   │   └── ConfidenceIndicator.tsx
│   └── ui/                 # Base UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── ProgressBar.tsx
├── pages/                  # Route components
│   ├── Dashboard.tsx           # Campaign overview
│   ├── BusinessDiscovery.tsx   # Search interface
│   ├── Results.tsx            # Lead results
│   └── AdminPanel.tsx         # System monitoring
├── hooks/                  # Custom React hooks
│   ├── useBusinessDiscovery.ts # Main discovery logic
│   ├── useRealTimeUpdates.ts   # Real-time subscriptions
│   ├── useCostTracking.ts     # Budget and cost monitoring
│   └── useExport.ts           # Data export functionality
├── stores/                 # State management
│   ├── campaignStore.ts       # Campaign state
│   ├── userStore.ts           # User preferences
│   └── systemStore.ts         # System status
├── lib/                    # Utilities and configs
│   ├── supabase.ts           # Supabase client
│   ├── api.ts               # API helpers
│   └── utils.ts             # Helper functions
└── types/                  # TypeScript definitions
    ├── campaign.ts           # Campaign types
    ├── lead.ts              # Lead types
    └── api.ts               # API response types
```

---

## 🔄 **State Management Strategy**

### **State Architecture: Hybrid Approach**

#### **Client State (Zustand)**

```typescript
// Campaign state - transient, session-based
interface CampaignStore {
  activeCampaign: Campaign | null;
  discoveryProgress: DiscoveryProgress;
  selectedLeads: string[];
  filters: LeadFilters;
  exportConfig: ExportConfig;
}

// User preferences - persistent
interface UserStore {
  budgetPreferences: BudgetPreferences;
  exportSettings: ExportSettings;
  dashboardLayout: DashboardConfig;
}
```

#### **Server State (React Query)**

```typescript
// API data - cached with invalidation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Key queries:
// - ['campaigns'] - Campaign list
// - ['leads', campaignId] - Campaign leads
// - ['costs', campaignId] - Cost tracking
// - ['system-health'] - System status
```

#### **Real-Time State (Supabase Subscriptions)**

```typescript
// Real-time updates bypass cache
const useRealTimeLeads = (campaignId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "enhanced_leads",
        },
        (payload) => {
          // Direct state update for real-time data
          queryClient.setQueryData(["leads", campaignId], (old) => [
            ...(old || []),
            payload.new,
          ]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [campaignId]);
};
```

---

## 🎨 **UI/UX Design System**

### **Design Principles**

1. **Progressive Disclosure** - Show complexity only when needed
2. **Real-Time Feedback** - Immediate visual response to actions
3. **Confidence Visualization** - Clear quality indicators
4. **Cost Transparency** - Always visible budget tracking

### **Component Design Patterns**

#### **Lead Display Pattern**

```typescript
interface LeadCardProps {
  lead: Lead;
  showDetails: boolean;
  onSelect: (leadId: string) => void;
  onExport: (leadId: string) => void;
}

// Visual hierarchy:
// 1. Business name + confidence score (prominent)
// 2. Contact info + validation status (secondary)
// 3. Source attribution + data points (tertiary)
```

#### **Progress Visualization Pattern**

```typescript
interface ProgressIndicatorProps {
  stage: DiscoveryStage;
  progress: number;
  totalCost: number;
  budgetLimit: number;
  remainingBudget: number;
}

// Visual states:
// - Active: Blue progress bar with animation
// - Completed: Green checkmark with summary
// - Warning: Yellow alert when near budget
// - Error: Red indicator with retry option
```

#### **Cost Display Pattern**

```typescript
interface CostTrackerProps {
  currentCost: number;
  budgetLimit: number;
  costBreakdown: ApiCostBreakdown;
  projectedTotal: number;
}

// Visual elements:
// - Primary: Large cost display with budget bar
// - Secondary: API breakdown chart
// - Tertiary: Cost per lead calculation
```

---

## 🔌 **API Integration Architecture**

### **Edge Function Integration**

```typescript
// Centralized API client
class ProspectProAPI {
  private supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  async startDiscovery(params: DiscoveryParams): Promise<Campaign> {
    const { data, error } = await this.supabase.functions.invoke(
      "enhanced-business-discovery",
      { body: params }
    );
    if (error) throw new APIError(error.message);
    return data;
  }

  async getLeads(campaignId: string): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from("enhanced_leads")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("confidence_score", { ascending: false });

    if (error) throw new APIError(error.message);
    return data;
  }

  async exportLeads(campaignId: string, format: ExportFormat): Promise<string> {
    const { data, error } = await this.supabase.functions.invoke(
      "export-campaign",
      { body: { campaignId, format } }
    );
    if (error) throw new APIError(error.message);
    return data.downloadUrl;
  }
}
```

### **Error Handling Strategy**

```typescript
// Centralized error handling
class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message);
  }
}

// Hook for error handling
const useAPIError = () => {
  const showError = (error: APIError) => {
    if (error.code === "BUDGET_EXCEEDED") {
      // Show budget exceeded modal with options
      showBudgetExceededModal();
    } else if (error.code === "QUOTA_EXCEEDED") {
      // Show API quota exceeded message
      showQuotaExceededMessage();
    } else if (error.recoverable) {
      // Show retry option
      showRetryableError(error);
    } else {
      // Show general error message
      showGeneralError(error);
    }
  };

  return { showError };
};
```

---

## 📈 **Performance Optimization**

### **Frontend Performance Strategy**

#### **Code Splitting & Lazy Loading**

```typescript
// Route-based code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BusinessDiscovery = lazy(() => import("./pages/BusinessDiscovery"));
const Results = lazy(() => import("./pages/Results"));

// Component-based splitting for heavy features
const ExportModal = lazy(() => import("./components/ExportModal"));
const AdvancedFilters = lazy(() => import("./components/AdvancedFilters"));
```

#### **React Query Optimizations**

```typescript
// Prefetch strategy
const usePrefetchCampaigns = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch likely next page
    queryClient.prefetchQuery(["campaigns"], fetchCampaigns);
  }, []);
};

// Background updates
const useBackgroundSync = (campaignId: string) => {
  return useQuery(["leads", campaignId], fetchLeads, {
    refetchInterval: 10000, // 10 seconds during active campaigns
    refetchIntervalInBackground: true,
  });
};
```

#### **Memory Management**

```typescript
// Cleanup strategy for large datasets
const useLeadPagination = (campaignId: string) => {
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: leads } = useQuery(
    ["leads", campaignId, page],
    () => fetchLeads(campaignId, page, pageSize),
    {
      keepPreviousData: true, // Smooth pagination
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Cleanup old pages when memory usage is high
  useEffect(() => {
    const cleanupOldPages = () => {
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll(["leads", campaignId]);

      if (queries.length > 10) {
        // Keep only 10 pages in cache
        queries.slice(0, -10).forEach((query) => {
          queryClient.removeQueries(query.queryKey);
        });
      }
    };

    const interval = setInterval(cleanupOldPages, 30000);
    return () => clearInterval(interval);
  }, [campaignId]);
};
```

---

## 🔒 **Security Architecture**

### **Frontend Security Measures**

#### **API Key Management**

```typescript
// Environment variable validation
const validateEnvVars = () => {
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

  const missing = required.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
};

// API key rotation handling
const useAPIKeyRotation = () => {
  useEffect(() => {
    const checkKeyValidity = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        if (error.message.includes("Invalid JWT")) {
          // Handle key rotation
          window.location.reload();
        }
      }
    };

    const interval = setInterval(checkKeyValidity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
};
```

#### **Data Validation**

```typescript
// Input sanitization
const sanitizeSearchInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML
    .substring(0, 100); // Limit length
};

// Response validation
const validateLeadData = (lead: unknown): Lead => {
  const schema = z.object({
    id: z.string(),
    business_name: z.string(),
    confidence_score: z.number().min(0).max(100),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  });

  return schema.parse(lead);
};
```

---

## 📊 **Monitoring & Analytics**

### **Frontend Monitoring Strategy**

#### **Performance Monitoring**

```typescript
// Performance metrics collection
const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "navigation") {
          // Track page load times
          analytics.track("page_load_time", {
            path: window.location.pathname,
            loadTime: entry.duration,
          });
        }
      });
    });

    observer.observe({ entryTypes: ["navigation", "measure"] });

    return () => observer.disconnect();
  }, []);
};
```

#### **Error Tracking**

```typescript
// Error boundary with reporting
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to monitoring service
    analytics.track("frontend_error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }
}
```

#### **User Analytics**

```typescript
// Campaign success tracking
const useCampaignAnalytics = () => {
  const trackCampaignStart = (params: DiscoveryParams) => {
    analytics.track("campaign_started", {
      businessType: params.businessType,
      location: params.location,
      budgetLimit: params.budgetLimit,
      timestamp: new Date().toISOString(),
    });
  };

  const trackCampaignComplete = (results: CampaignResults) => {
    analytics.track("campaign_completed", {
      totalLeads: results.totalLeads,
      qualifiedLeads: results.qualifiedLeads,
      totalCost: results.totalCost,
      costPerLead: results.costPerLead,
      duration: results.duration,
      timestamp: new Date().toISOString(),
    });
  };

  return { trackCampaignStart, trackCampaignComplete };
};
```

---

## 🚀 **Deployment Architecture**

### **Production Deployment Pipeline**

#### **Build Configuration**

```typescript
// vite.config.ts - Production optimizations
export default defineConfig({
  build: {
    target: "es2020",
    minify: "terser",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          charts: ["recharts"],
        },
      },
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
```

#### **Environment Management**

```bash
# Development
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=dev_anon_key
VITE_ENABLE_DEBUG=true

# Production
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

#### **Deployment Strategy**

```yaml
# GitHub Actions deployment
name: Deploy to Lovable
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test
      - run: lovable deploy --prod
```

---

## ✅ **Implementation Readiness Checklist**

### **Backend Integration Points**

- ✅ **Supabase Database** - Production schema deployed
- ✅ **Edge Functions** - All functions deployed and tested
- ✅ **Real-time Subscriptions** - Row Level Security configured
- ✅ **Webhook System** - Event-driven updates operational
- ✅ **Cost Tracking** - Budget management APIs ready

### **Frontend Development Ready**

- ✅ **API Compatibility** - All endpoints documented and tested
- ✅ **Real-time Data** - Subscription patterns defined
- ✅ **State Management** - Architecture and patterns defined
- ✅ **Component Library** - Design system and patterns ready
- ✅ **Performance Strategy** - Optimization patterns defined

**The architecture is production-ready for immediate Lovable implementation!** 🚀
