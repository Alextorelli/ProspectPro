/**
 * Cobalt Intelligence Secretary of State API Client
 *
 * Provides unified SOS verification coverage across supported US states with
 * cache-first lookups and automatic polling for long-running live requests.
 */

const DEFAULT_BASE_URL = "https://apigateway.cobaltintelligence.com/v1";
const DEFAULT_POLL_INTERVAL_MS = 4000;
const DEFAULT_MAX_POLL_ATTEMPTS = 6;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_NETWORK_RETRIES = 2;

const STATE_ALIASES = {
  alabama: "al",
  alaska: "ak",
  arizona: "az",
  arkansas: "ar",
  california: "ca",
  colorado: "co",
  connecticut: "ct",
  "district of columbia": "dc",
  "washington dc": "dc",
  delaware: "de",
  florida: "fl",
  georgia: "ga",
  hawaii: "hi",
  idaho: "id",
  illinois: "il",
  indiana: "in",
  iowa: "ia",
  kansas: "ks",
  kentucky: "ky",
  louisiana: "la",
  maine: "me",
  maryland: "md",
  massachusetts: "ma",
  michigan: "mi",
  minnesota: "mn",
  mississippi: "ms",
  missouri: "mo",
  montana: "mt",
  nebraska: "ne",
  nevada: "nv",
  "new hampshire": "nh",
  "new jersey": "nj",
  "new mexico": "nm",
  "new york": "ny",
  "north carolina": "nc",
  "north dakota": "nd",
  ohio: "oh",
  oklahoma: "ok",
  oregon: "or",
  pennsylvania: "pa",
  "rhode island": "ri",
  "south carolina": "sc",
  "south dakota": "sd",
  tennessee: "tn",
  texas: "tx",
  utah: "ut",
  vermont: "vt",
  virginia: "va",
  washington: "wa",
  "west virginia": "wv",
  wisconsin: "wi",
  wyoming: "wy",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toBooleanString(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === "true" || value === "false") {
    return value;
  }
  return undefined;
}

class CobaltSOSClient {
  constructor(apiKey = null, options = {}) {
    this.apiKey =
      apiKey ||
      process.env.COBALT_INTELLIGENCE_API_KEY ||
      process.env.COBALT_API_KEY;
    this.baseUrl =
      options.baseUrl || process.env.COBALT_SOS_BASE_URL || DEFAULT_BASE_URL;
    this.pollIntervalMs =
      typeof options.pollIntervalMs === "number"
        ? options.pollIntervalMs
        : DEFAULT_POLL_INTERVAL_MS;
    this.maxPollAttempts =
      typeof options.maxPollAttempts === "number"
        ? options.maxPollAttempts
        : DEFAULT_MAX_POLL_ATTEMPTS;
    this.timeoutMs =
      typeof options.timeoutMs === "number"
        ? options.timeoutMs
        : DEFAULT_TIMEOUT_MS;
    this.networkRetries =
      typeof options.networkRetries === "number"
        ? options.networkRetries
        : DEFAULT_NETWORK_RETRIES;
    this.defaultLiveData =
      typeof options.defaultLiveData === "boolean"
        ? options.defaultLiveData
        : false;
    this.enablePolling =
      typeof options.enablePolling === "boolean" ? options.enablePolling : true;
  }

  async searchBusiness(params = {}) {
    this.ensureApiKey();

    const startedAt = Date.now();
    const { query, context } = this.prepareParams(params);
    const initialResponse = await this.executeRequest(query, context);

    if (!this.enablePolling || !this.shouldPoll(initialResponse)) {
      initialResponse.durationMs = Date.now() - startedAt;
      return initialResponse;
    }

    const finalResponse = await this.pollForCompletion(
      initialResponse,
      context,
      startedAt
    );

    finalResponse.durationMs = Date.now() - startedAt;
    return finalResponse;
  }

  ensureApiKey() {
    if (!this.apiKey) {
      throw new Error(
        "Cobalt Intelligence API key missing. Set COBALT_INTELLIGENCE_API_KEY."
      );
    }
  }

  prepareParams(params = {}) {
    const query = new URLSearchParams();

    const trimmed = (value) =>
      typeof value === "string" ? value.trim() : value;

    const context = {
      requestType: params.retryId ? "retry" : "search",
      liveData:
        typeof params.liveData === "boolean"
          ? params.liveData
          : this.defaultLiveData,
      state: params.state ? this.normalizeState(params.state) : null,
      searchQuery: trimmed(params.searchQuery) || null,
      sosId: trimmed(params.sosId) || null,
      searchByPersonFirstName: trimmed(params.searchByPersonFirstName) || null,
      searchByPersonLastName: trimmed(params.searchByPersonLastName) || null,
      retryId: trimmed(params.retryId) || null,
      addressFilters: {},
      screenshot:
        typeof params.screenshot === "boolean" ? params.screenshot : null,
      uccData: typeof params.uccData === "boolean" ? params.uccData : null,
    };

    const hasSearchTerm =
      context.searchQuery ||
      context.sosId ||
      context.searchByPersonFirstName ||
      context.searchByPersonLastName;

    if (context.requestType === "search") {
      if (!context.state) {
        throw new Error(
          "State is required when initiating a Cobalt SOS search request."
        );
      }

      if (!hasSearchTerm) {
        throw new Error(
          "Cobalt SOS search requires searchQuery, sosId, or person name."
        );
      }

      query.append("state", context.state);
      query.append("liveData", context.liveData ? "true" : "false");

      if (context.searchQuery) {
        query.append("searchQuery", context.searchQuery);
      }

      if (context.sosId) {
        query.append("sosId", context.sosId);
      }

      if (context.searchByPersonFirstName) {
        query.append(
          "searchByPersonFirstName",
          context.searchByPersonFirstName
        );
      }

      if (context.searchByPersonLastName) {
        query.append("searchByPersonLastName", context.searchByPersonLastName);
      }
    } else {
      if (!context.retryId) {
        throw new Error("retryId is required when polling Cobalt SOS results.");
      }

      query.append("retryId", context.retryId);

      if (context.state) {
        query.append("state", context.state);
      }

      query.append("liveData", context.liveData ? "true" : "false");
    }

    if (params.street) {
      const street = trimmed(params.street);
      if (street) {
        query.append("street", street);
        context.addressFilters.street = street;
      }
    }

    if (params.city) {
      const city = trimmed(params.city);
      if (city) {
        query.append("city", city);
        context.addressFilters.city = city;
      }
    }

    if (params.zip) {
      const zip = trimmed(params.zip);
      if (zip) {
        query.append("zip", zip);
        context.addressFilters.zip = zip;
      }
    }

    if (params.test) {
      const testParam = trimmed(params.test);
      if (testParam) {
        query.append("test", testParam);
      }
    }

    if (params.callbackUrl) {
      const callbackUrl = trimmed(params.callbackUrl);
      if (callbackUrl) {
        query.append("callbackUrl", callbackUrl);
      }
    }

    const screenshotValue = toBooleanString(params.screenshot);
    if (screenshotValue) {
      query.append("screenshot", screenshotValue);
    }

    const uccValue = toBooleanString(params.uccData);
    if (uccValue) {
      query.append("uccData", uccValue);
    }

    return { query, context };
  }

  shouldPoll(response) {
    if (!response || response.failed) {
      return false;
    }

    if (!response.retryId) {
      return false;
    }

    if (response.completed) {
      return false;
    }

    return true;
  }

  async pollForCompletion(initialResponse, baseContext, startedAt) {
    let attempts = 0;
    let lastResponse = initialResponse;

    while (attempts < this.maxPollAttempts && this.shouldPoll(lastResponse)) {
      attempts += 1;
      await sleep(this.pollIntervalMs);

      const pollParams = {
        retryId: lastResponse.retryId,
        state: baseContext.state,
        liveData: baseContext.liveData,
        screenshot: baseContext.screenshot,
        uccData: baseContext.uccData,
      };

      const { query, context } = this.prepareParams(pollParams);
      context.searchQuery = baseContext.searchQuery;
      context.sosId = baseContext.sosId;
      context.addressFilters = baseContext.addressFilters;

      lastResponse = await this.executeRequest(query, context);
      lastResponse.pollAttempts = attempts;
      lastResponse.durationMs = Date.now() - startedAt;

      if (!this.shouldPoll(lastResponse)) {
        return lastResponse;
      }
    }

    lastResponse.pollAttempts =
      typeof lastResponse.pollAttempts === "number"
        ? lastResponse.pollAttempts
        : attempts;
    lastResponse.pending = true;
    lastResponse.timedOut = true;
    return lastResponse;
  }

  async executeRequest(query, context) {
    const requestStarted = Date.now();
    const { data, status } = await this.makeRequest("/search", query);
    const normalized = this.normalizeResponse(data, status, context);
    normalized.responseLatencyMs = Date.now() - requestStarted;
    normalized.pollAttempts = normalized.pollAttempts || 0;
    return normalized;
  }

  async makeRequest(path, query, attempt = 0) {
    const url = `${this.baseUrl}${path}?${query.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      const httpStatus = response.status;
      const body = await response.text();
      let data = null;

      if (body) {
        try {
          data = JSON.parse(body);
        } catch (parseError) {
          data = { rawBody: body };
        }
      }

      if (!response.ok && httpStatus !== 202) {
        if (
          (httpStatus === 429 || httpStatus >= 500) &&
          attempt < this.networkRetries
        ) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await sleep(delayMs);
          return this.makeRequest(path, query, attempt + 1);
        }

        const message =
          (data && data.message) || `Cobalt SOS API error (${httpStatus})`;
        const error = new Error(message);
        error.httpStatus = httpStatus;
        error.response = data;
        throw error;
      }

      return { data, status: httpStatus };
    } catch (error) {
      if (error.name === "AbortError") {
        if (attempt < this.networkRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await sleep(delayMs);
          return this.makeRequest(path, query, attempt + 1);
        }

        const timeoutError = new Error("Cobalt SOS request timed out");
        timeoutError.code = "ETIMEDOUT";
        throw timeoutError;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  normalizeResponse(rawData, httpStatus, context) {
    const data = rawData && typeof rawData === "object" ? rawData : {};
    const statusText = typeof data.status === "string" ? data.status : "";
    const statusLower = statusText.toLowerCase();
    const statusCode =
      typeof data.statusCode === "number"
        ? data.statusCode
        : parseInt(data.statusCode, 10);

    const category = this.getStatusCategory(
      statusLower,
      httpStatus,
      statusCode,
      data
    );

    const results = Array.isArray(data.results) ? data.results : [];
    const alternatives = Array.isArray(data.possibleAlternatives)
      ? data.possibleAlternatives
      : [];

    return {
      status: statusText || null,
      statusCode: Number.isFinite(statusCode) ? statusCode : httpStatus,
      message: typeof data.message === "string" ? data.message : null,
      retryId: data.retryId || context.retryId || null,
      requestId: data.requestId || null,
      completed: category === "completed",
      pending: category === "pending",
      failed: category === "failed",
      statusCategory: category,
      nameAvailable:
        typeof data.nameAvailable === "boolean" ? data.nameAvailable : null,
      results,
      possibleAlternatives: alternatives,
      liveDataRequested: context.liveData === true,
      usedCache: context.liveData === false,
      requestType: context.requestType,
      state: context.state,
      searchQuery: context.searchQuery,
      sosId: context.sosId,
      addressFilters: context.addressFilters,
      pollAttempts: 0,
      httpStatus,
      timestamp: new Date().toISOString(),
      raw: data,
    };
  }

  getStatusCategory(status, httpStatus, statusCode, data) {
    const normalizedStatus = status || "";

    if (httpStatus === 202) {
      return "pending";
    }

    if (httpStatus >= 400) {
      return "failed";
    }

    if (statusCode && statusCode >= 400) {
      return "failed";
    }

    if (
      ["pending", "retry", "processing", "queued", "in-progress"].includes(
        normalizedStatus
      )
    ) {
      return "pending";
    }

    if (
      [
        "failed",
        "error",
        "notfound",
        "badrequest",
        "cancelled",
        "timeout",
      ].includes(normalizedStatus)
    ) {
      return "failed";
    }

    if (
      ["complete", "completed", "success", "succeeded", "ok"].includes(
        normalizedStatus
      )
    ) {
      return "completed";
    }

    if (
      data.retryId &&
      (!Array.isArray(data.results) || !data.results.length)
    ) {
      return "pending";
    }

    if (!normalizedStatus && data.retryId) {
      return "pending";
    }

    return "completed";
  }

  normalizeState(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (/^[a-z]{2}$/i.test(trimmed)) {
      return trimmed.toLowerCase();
    }

    const lower = trimmed.toLowerCase();
    if (STATE_ALIASES[lower]) {
      return STATE_ALIASES[lower];
    }

    const cleaned = lower
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (STATE_ALIASES[cleaned]) {
      return STATE_ALIASES[cleaned];
    }

    const parts = cleaned.split(" ");
    if (!parts.length) {
      return trimmed;
    }

    const camel =
      parts[0] +
      parts
        .slice(1)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("");
    return camel || trimmed;
  }
}

module.exports = CobaltSOSClient;
