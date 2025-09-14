# Frontend Integration Guide

Add a modern UI to your ProspectPro backend with these recommended platforms.

## 🎨 UI Platform Options

### Option 1: Vercel + Next.js (Recommended)
- **Best For**: Modern React frontend with SSR
- **Cost**: Free tier available, $20/month pro
- **Setup Time**: 15 minutes
- **Features**: Automatic deployments, edge functions, analytics

### Option 2: Netlify + React
- **Best For**: Static React apps with API integration  
- **Cost**: Free tier available, $19/month pro
- **Setup Time**: 10 minutes
- **Features**: Form handling, serverless functions, CDN

### Option 3: Railway Frontend + Backend
- **Best For**: Full-stack deployment on single platform
- **Cost**: $5/month for both frontend + backend
- **Setup Time**: 20 minutes  
- **Features**: Integrated deployment, database, monitoring

---

## 🚀 Quick Frontend Setup

### Option 1: Next.js + Vercel

#### 1. Create Next.js Frontend
```powershell
# In your ProspectPro directory
npx create-next-app@latest prospectpro-ui --typescript --tailwind --eslint --app
cd prospectpro-ui
```

#### 2. Install Dependencies
```powershell
npm install axios @headlessui/react @heroicons/react recharts react-hook-form
```

#### 3. Configure API Connection
Create `lib/api.ts`:
```typescript
// lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

export const businessApi = {
  discover: (params: { businessType: string; location: string; maxResults: number }) =>
    apiClient.post('/api/business/discover', params),
    
  getStatus: () => 
    apiClient.get('/api/status'),
    
  exportLeads: (campaignId: string, format: 'csv' | 'json') =>
    apiClient.get(`/api/export/${campaignId}?format=${format}`)
};
```

#### 4. Create Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_ACCESS_TOKEN=your-personal-access-token
```

#### 5. Build Main Dashboard
Create `app/dashboard/page.tsx`:
```typescript
'use client';
import { useState } from 'react';
import { businessApi } from '@/lib/api';

export default function Dashboard() {
  const [campaign, setCampaign] = useState({
    businessType: '',
    location: '',
    maxResults: 10
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDiscovery = async () => {
    setLoading(true);
    try {
      const response = await businessApi.discover(campaign);
      setResults(response.data);
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">ProspectPro Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">New Campaign</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Business Type (e.g., restaurant)"
            className="border rounded px-3 py-2"
            value={campaign.businessType}
            onChange={(e) => setCampaign({...campaign, businessType: e.target.value})}
          />
          
          <input
            type="text"
            placeholder="Location (e.g., New York, NY)"
            className="border rounded px-3 py-2"
            value={campaign.location}
            onChange={(e) => setCampaign({...campaign, location: e.target.value})}
          />
          
          <input
            type="number"
            placeholder="Max Results"
            className="border rounded px-3 py-2"
            value={campaign.maxResults}
            onChange={(e) => setCampaign({...campaign, maxResults: parseInt(e.target.value)})}
          />
        </div>
        
        <button
          onClick={handleDiscovery}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Discovering...' : 'Start Discovery'}
        </button>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

#### 6. Deploy to Vercel
```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: prospectpro-ui
# - Directory: ./
# - Framework: Next.js
```

#### 7. Set Production Environment Variables
In Vercel dashboard:
- Go to Settings → Environment Variables
- Add `NEXT_PUBLIC_API_URL` = your backend URL
- Add `NEXT_PUBLIC_ACCESS_TOKEN` = your access token

### Option 2: React + Netlify

#### 1. Create React App
```powershell
npx create-react-app prospectpro-ui --template typescript
cd prospectpro-ui
npm install axios @types/axios
```

#### 2. Build Dashboard Component
Create `src/Dashboard.tsx`:
```typescript
import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

export const Dashboard: React.FC = () => {
  const [campaign, setCampaign] = useState({
    businessType: '',
    location: '',
    maxResults: 10
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDiscovery = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/business/discover', campaign);
      setResults(response.data);
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>ProspectPro Dashboard</h1>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>New Campaign</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Business Type"
            value={campaign.businessType}
            onChange={(e) => setCampaign({...campaign, businessType: e.target.value})}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          
          <input
            type="text"
            placeholder="Location"
            value={campaign.location}
            onChange={(e) => setCampaign({...campaign, location: e.target.value})}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          
          <input
            type="number"
            placeholder="Max Results"
            value={campaign.maxResults}
            onChange={(e) => setCampaign({...campaign, maxResults: parseInt(e.target.value)})}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        
        <button
          onClick={handleDiscovery}
          disabled={loading}
          style={{ 
            background: '#007bff', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {loading ? 'Discovering...' : 'Start Discovery'}
        </button>
      </div>

      {results && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Results</h2>
          <pre style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
```

#### 3. Update src/App.tsx
```typescript
import React from 'react';
import { Dashboard } from './Dashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;
```

#### 4. Create .env file
```env
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_ACCESS_TOKEN=your-personal-access-token
```

#### 5. Build and Deploy
```powershell
# Build for production
npm run build

# Deploy to Netlify (install CLI first)
npm install -g netlify-cli
netlify deploy --prod --dir=build

# Or drag and drop the build folder to netlify.com
```

### Option 3: Railway Full-Stack

#### 1. Create Frontend Service
In your Railway dashboard:
1. Click "New" → "GitHub Repo" 
2. Select your ProspectPro repository
3. Click "Add Service"
4. Choose "Create Service from Repo"

#### 2. Configure Frontend Build
Create `frontend/package.json` in your repo:
```json
{
  "name": "prospectpro-ui",
  "version": "1.0.0",
  "scripts": {
    "build": "npm run build:frontend",
    "build:frontend": "cd frontend && npm ci && npm run build",
    "start": "serve -s build -l 3001"
  },
  "dependencies": {
    "serve": "^14.2.1"
  }
}
```

#### 3. Set Environment Variables
In Railway frontend service:
```
REACT_APP_API_URL=${{ProspectPro.RAILWAY_PUBLIC_DOMAIN}}
REACT_APP_ACCESS_TOKEN=your-personal-access-token
```

---

## 🎯 Advanced UI Components

### Campaign Management Dashboard

```typescript
// components/CampaignManager.tsx
import { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  businessType: string;
  location: string;
  status: 'running' | 'completed' | 'failed';
  totalLeads: number;
  qualifiedLeads: number;
  costPerLead: number;
  createdAt: string;
}

export const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // Load campaigns from API
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    // Implement API call to get campaigns
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaigns</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold">{campaign.name}</h3>
              <span className={`px-2 py-1 rounded text-sm ${
                campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                campaign.status === 'running' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {campaign.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Type:</strong> {campaign.businessType}</p>
              <p><strong>Location:</strong> {campaign.location}</p>
              <p><strong>Total Leads:</strong> {campaign.totalLeads}</p>
              <p><strong>Qualified:</strong> {campaign.qualifiedLeads}</p>
              <p><strong>Cost/Lead:</strong> ${campaign.costPerLead}</p>
            </div>

            <div className="mt-4 flex space-x-2">
              <button className="text-blue-600 hover:text-blue-800">
                View Details
              </button>
              <button className="text-green-600 hover:text-green-800">
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Lead Quality Dashboard

```typescript
// components/LeadQualityDashboard.tsx
import { useState, useEffect } from 'react';

interface QualityMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  qualificationRate: number;
  avgConfidenceScore: number;
  websiteAccessibility: number;
  emailDeliverability: number;
  phoneValidation: number;
}

export const LeadQualityDashboard = () => {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    // Load from API
  };

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Lead Quality Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          subtitle="All discovered"
        />
        <MetricCard
          title="Qualified Leads" 
          value={metrics.qualifiedLeads}
          subtitle={`${metrics.qualificationRate}% qualified`}
        />
        <MetricCard
          title="Confidence Score"
          value={`${metrics.avgConfidenceScore}%`}
          subtitle="Average quality"
        />
        <MetricCard
          title="Website Access"
          value={`${metrics.websiteAccessibility}%`}
          subtitle="URLs working"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ValidationChart 
          data={{
            'Website Valid': metrics.websiteAccessibility,
            'Email Deliverable': metrics.emailDeliverability,
            'Phone Valid': metrics.phoneValidation
          }}
        />
        
        <RecentActivity />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle }: { title: string; value: number | string; subtitle: string }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600">{subtitle}</p>
  </div>
);
```

---

## 🔧 API Integration Patterns

### Error Handling
```typescript
// utils/api-utils.ts
export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Handle unauthorized
    window.location.href = '/login';
  } else if (error.response?.status === 429) {
    // Handle rate limiting
    return { error: 'Too many requests. Please wait and try again.' };
  } else if (error.response?.data?.message) {
    return { error: error.response.data.message };
  } else {
    return { error: 'An unexpected error occurred' };
  }
};
```

### Real-time Updates
```typescript
// hooks/useRealTimeUpdates.ts
import { useEffect, useState } from 'react';

export const useRealTimeUpdates = (campaignId: string) => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    // In a full implementation, you'd use WebSocket or Server-Sent Events
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/status`);
        const data = await response.json();
        setUpdates(prev => [...prev, data]);
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [campaignId]);

  return updates;
};
```

### Cost Tracking
```typescript
// components/CostTracker.tsx
export const CostTracker = ({ campaignId }: { campaignId: string }) => {
  const [costs, setCosts] = useState({
    googlePlaces: 0,
    scrapingdog: 0,
    hunter: 0,
    neverbounce: 0,
    total: 0
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">API Costs</h3>
      
      <div className="space-y-3">
        <CostItem label="Google Places" cost={costs.googlePlaces} />
        <CostItem label="ScrapingDog" cost={costs.scrapingdog} />
        <CostItem label="Hunter.io" cost={costs.hunter} />
        <CostItem label="NeverBounce" cost={costs.neverbounce} />
        <hr />
        <CostItem label="Total" cost={costs.total} isTotal />
      </div>
    </div>
  );
};

const CostItem = ({ label, cost, isTotal = false }: { label: string; cost: number; isTotal?: boolean }) => (
  <div className={`flex justify-between ${isTotal ? 'font-bold text-lg' : ''}`}>
    <span>{label}</span>
    <span>${cost.toFixed(4)}</span>
  </div>
);
```

---

## 📱 Mobile Responsive Design

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'prospect-blue': '#1e40af',
        'prospect-green': '#059669',
        'prospect-red': '#dc2626'
      }
    }
  },
  plugins: []
};
```

### Mobile-First Components
```typescript
// components/MobileDashboard.tsx
export const MobileDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm p-4 md:hidden">
        <h1 className="text-xl font-bold">ProspectPro</h1>
      </header>

      {/* Desktop Sidebar, Mobile Bottom Nav */}
      <nav className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        {/* Desktop navigation */}
      </nav>
      
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        {/* Mobile bottom navigation */}
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 pb-16 md:pb-0 p-4">
        {/* Responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Content cards */}
        </div>
      </main>
    </div>
  );
};
```

---

Your ProspectPro now has multiple frontend options! Choose the platform that best fits your technical preferences and deployment needs. 🎉