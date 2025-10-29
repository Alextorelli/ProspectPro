import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { H } from "highlight.run";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { supabase } from "./lib/supabase";
const highlightProjectId =
  import.meta.env.VITE_HIGHLIGHT_PROJECT_ID ??
  import.meta.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID ??
  "";
const highlightServiceName =
  import.meta.env.VITE_HIGHLIGHT_SERVICE_NAME ??
  import.meta.env.NEXT_PUBLIC_HIGHLIGHT_SERVICE_NAME ??
  "frontend-app";

if (highlightProjectId) {
  H.init(highlightProjectId, {
    serviceName: highlightServiceName,
    tracingOrigins: true,
    networkRecording: {
      enabled: true,
      recordHeadersAndBody: true,
      urlBlocklist: [
        // Add URLs to exclude from recording if needed
      ],
    },
  });
} else {
  console.warn(
    "Highlight project ID missing. Set VITE_HIGHLIGHT_PROJECT_ID or NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID."
  );
}

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
