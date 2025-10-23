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
            <Route element={<BusinessDiscovery />} path="/" />
            <Route element={<Dashboard />} path="/dashboard" />
            <Route element={<BusinessDiscovery />} path="/discovery" />
            <Route element={<Campaign />} path="/campaign" />
            <Route
              element={<CampaignProgress />}
              path="/campaign/:campaignId/progress"
            />
            <Route element={<Results />} path="/results" />
            <Route element={<AccountPage />} path="/account" />
            <Route element={<AdminPanel />} path="/admin" />
            <Route element={<AuthCallback />} path="/auth/callback" />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
