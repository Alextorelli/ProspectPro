import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { supabase } from "./src/lib/supabase";

if (typeof window !== "undefined") {
  (window as typeof window & { __supabase?: typeof supabase }).__supabase =
    supabase;
}

if (import.meta.env.DEV) {
  import("react-devtools-core").then(({ connectToDevTools }) => {
    connectToDevTools({
      host: window.location.hostname,
      port: 8097,
    });
  });
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
