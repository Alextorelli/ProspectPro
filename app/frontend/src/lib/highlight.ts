import { H } from "highlight.run";

type IdentifyMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

const projectIdFromEnv =
  import.meta.env.VITE_HIGHLIGHT_PROJECT_ID ??
  import.meta.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID ??
  "";

const fallbackProjectId = "kgr09vng";
const highlightProjectId = projectIdFromEnv || fallbackProjectId;

const highlightServiceName =
  import.meta.env.VITE_HIGHLIGHT_SERVICE_NAME ??
  import.meta.env.NEXT_PUBLIC_HIGHLIGHT_SERVICE_NAME ??
  "frontend-app";

const blocklistEnvRaw =
  import.meta.env.VITE_HIGHLIGHT_NETWORK_BLOCKLIST ??
  import.meta.env.NEXT_PUBLIC_HIGHLIGHT_NETWORK_BLOCKLIST ??
  "";

// Recommended defaults from Highlight docs to exclude auth tokens.
const defaultBlocklist = [
  "https://www.googleapis.com/identitytoolkit",
  "https://securetoken.googleapis.com",
];

const additionalBlocklist = blocklistEnvRaw
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const urlBlocklist = Array.from(
  new Set([...defaultBlocklist, ...additionalBlocklist])
);

const shouldInitializeHighlight =
  typeof window !== "undefined" && Boolean(highlightProjectId);

let highlightInitialized = false;

if (shouldInitializeHighlight) {
  H.init(highlightProjectId, {
    serviceName: highlightServiceName,
    environment: import.meta.env.MODE ?? "production",
    tracingOrigins: true,
    networkRecording: {
      enabled: true,
      recordHeadersAndBody: true,
      urlBlocklist,
    },
  });
  highlightInitialized = true;
} else if (import.meta.env.DEV) {
  console.warn(
    "Highlight project ID missing. Set VITE_HIGHLIGHT_PROJECT_ID or NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID to enable session replay."
  );
}

const sanitizeMetadata = (
  metadata: IdentifyMetadata | undefined
): Record<string, string | number | boolean> | undefined => {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== undefined && value !== null
  );

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as Record<
    string,
    string | number | boolean
  >;
};

export const identifyHighlightUser = (
  identifier: string | null | undefined,
  metadata?: IdentifyMetadata
) => {
  if (!highlightInitialized || !identifier) {
    return;
  }

  const sanitizedMetadata = sanitizeMetadata(metadata);

  if (sanitizedMetadata) {
    H.identify(identifier, sanitizedMetadata);
  } else {
    H.identify(identifier);
  }
};

export const isHighlightEnabled = () => highlightInitialized;
export {
  H,
  urlBlocklist as highlightNetworkBlocklist,
  highlightProjectId,
  highlightServiceName,
};
