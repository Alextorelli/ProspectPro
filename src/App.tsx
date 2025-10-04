import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminPanel } from "./pages/AdminPanel";
import { BusinessDiscovery } from "./pages/BusinessDiscovery";
import { Campaign } from "./pages/Campaign";
import { Dashboard } from "./pages/Dashboard";
import { Results } from "./pages/Results";

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<BusinessDiscovery />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/discovery" element={<BusinessDiscovery />} />
          <Route path="/campaign" element={<Campaign />} />
          <Route path="/results" element={<Results />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
