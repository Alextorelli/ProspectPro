# ProspectPro Frontend Integration

🎯 **Modern React/TypeScript frontend for ProspectPro's real business lead discovery platform**

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your actual Supabase keys

# 3. Start development server
npm run dev
```

Open http://localhost:5173 to access the application.

## 🏗️ Architecture

### Core Components

- **Dashboard** - Campaign overview and statistics
- **Business Discovery** - Real-time search and validation interface
- **Results Viewer** - Lead display with confidence scoring and export
- **Admin Panel** - System monitoring and API usage analytics

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand with persistence
- **API Integration**: React Query + Supabase client
- **Routing**: React Router DOM

## 🔗 Supabase Integration

### Edge Functions (Already Deployed)

```
https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1/
├── enhanced-business-discovery - Main 4-stage pipeline
├── lead-validation-edge - Individual lead validation
├── business-discovery-edge - Basic business search
└── diag - System diagnostics
```

### Required Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://sriycekxdqnesdsgwiuc.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Edge Functions URL (auto-configured)
VITE_EDGE_FUNCTIONS_URL=https://sriycekxdqnesdsgwiuc.supabase.co/functions/v1

# Optional: Direct API keys for client-side calls
VITE_GOOGLE_PLACES_API_KEY=your_key_here
VITE_HUNTER_IO_API_KEY=your_key_here
VITE_ZEROBOUNCE_API_KEY=your_key_here
```

## 🎨 Key Features

### Zero Fake Data Enforcement

- Real-time validation indicators with confidence scoring
- Source attribution for all data points
- Quality gates before export (70%+ confidence required)
- Visual feedback for data authenticity

### Cost Optimization Dashboard

- Budget tracking with real-time alerts
- API usage visualization and quotas
- Cost per lead calculations
- Pre-validation filtering to reduce API waste

### User Experience

- Progressive disclosure of complexity
- Real-time progress tracking during discovery
- Responsive design for all devices
- Export capabilities (CSV/JSON)

## 📊 Data Flow

1. **Campaign Configuration** - User sets search terms, location, and budget
2. **Real-time Discovery** - Edge function orchestrates 4-stage pipeline
3. **Progress Tracking** - Live updates with cost and quality metrics
4. **Results Display** - Confidence-scored leads with validation status
5. **Export Management** - Quality-filtered data export

## 🔧 Development Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run type-check # TypeScript type checking
```

## 🛠️ Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── Layout.tsx     # Main app layout
│   ├── pages/            # Route components
│   │   ├── Dashboard.tsx      # Campaign overview
│   │   ├── BusinessDiscovery.tsx  # Search interface
│   │   ├── Results.tsx        # Lead results viewer
│   │   └── AdminPanel.tsx     # System monitoring
│   ├── hooks/            # Custom React hooks
│   │   └── useBusinessDiscovery.ts  # Main discovery logic
│   ├── stores/           # Zustand state management
│   │   └── campaignStore.ts   # Campaign and lead state
│   ├── lib/              # Utilities and configurations
│   │   ├── supabase.ts       # Supabase client setup
│   │   └── utils.ts          # Helper functions
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts          # Core types and interfaces
│   └── App.tsx           # Root application component
├── public/               # Static assets
└── dist/                # Production build output
```

## 🔐 Security & Authentication

- **Row Level Security (RLS)** enabled on all Supabase tables
- **JWT-based authentication** for Edge Function calls
- **Environment variable isolation** for sensitive keys
- **CORS configuration** for secure API communication

## 📈 Performance Optimizations

- **Code splitting** with React.lazy for route-based loading
- **API response caching** with React Query
- **Optimistic updates** for better UX
- **Bundle optimization** with Vite's tree shaking

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module 'react'" errors**

   - Run `npm install` to ensure all dependencies are installed
   - Check that you're in the `frontend/` directory

2. **Supabase connection errors**

   - Verify your `.env` file has the correct SUPABASE_URL and SUPABASE_ANON_KEY
   - Check that your Supabase project is active

3. **Edge Function 404 errors**

   - Ensure Edge Functions are deployed via `npx supabase functions deploy`
   - Verify function URLs match your project reference

4. **CORS errors**
   - Check that your domain is allowed in Supabase CORS settings
   - For localhost development, CORS should be automatically configured

### Development Tips

- Use browser DevTools Network tab to inspect API calls
- Check the Supabase Dashboard for Edge Function logs
- Use React DevTools for component state debugging
- Monitor console for TypeScript errors

## 🚀 Deployment

The frontend is designed to deploy to any static hosting provider:

- **Netlify**: Drag and drop the `dist/` folder
- **Vercel**: Connect your GitHub repo for auto-deployment
- **Supabase Static Hosting**: Upload via Supabase CLI
- **Railway**: Add as a service to your existing Railway project

## 📝 Next Steps

1. **Configure Environment Variables**

   - Get your Supabase anon key from the [Supabase Dashboard](https://supabase.com/dashboard/project/sriycekxdqnesdsgwiuc/settings/api)
   - Add API keys for enhanced functionality

2. **Test Edge Function Integration**

   - Run a test discovery campaign
   - Verify real-time updates and cost tracking

3. **Customize UI/UX**

   - Modify Tailwind theme in `tailwind.config.js`
   - Add your branding and color scheme

4. **Production Deployment**
   - Build with `npm run build`
   - Deploy `dist/` folder to your hosting provider
   - Configure environment variables in production

---

**Zero Fake Data Guarantee™** - This frontend integrates with our verified API pipeline to ensure every business lead is real, validated, and actionable.
