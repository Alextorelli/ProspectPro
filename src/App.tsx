import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { AccountPage } from "./pages/AccountPage";
import { AdminPanel } from "./pages/AdminPanel";
import { AuthCallback } from "./pages/AuthCallback";
import { BusinessDiscovery } from "./pages/BusinessDiscovery";
import { Campaign } from "./pages/Campaign";
import { CampaignProgress } from "./pages/CampaignProgress";
import Dashboard from "./pages/Dashboard";
import { Results } from "./pages/Results";

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<BusinessDiscovery />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discovery" element={<BusinessDiscovery />} />
            <Route path="/campaign" element={<Campaign />} />
            <Route
              path="/campaign/:campaignId/progress"
              element={<CampaignProgress />}
            />
            <Route path="/results" element={<Results />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
