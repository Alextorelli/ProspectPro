import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminPanel } from "./pages/AdminPanel";
import { BusinessDiscovery } from "./pages/BusinessDiscovery";
import { Dashboard } from "./pages/Dashboard";
import { Results } from "./pages/Results";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/discovery" element={<BusinessDiscovery />} />
        <Route path="/results" element={<Results />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Layout>
  );
}

export default App;
