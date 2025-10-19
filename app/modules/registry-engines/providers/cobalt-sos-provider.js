/**
 * Cobalt Intelligence SOS Registry Provider
 *
 * Aggregates Secretary of State records using the Cobalt Intelligence API with
 * cache-first lookups and live fallbacks for owner verification.
 */

const US_STATE_CODES = new Set([
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "dc",
  "de",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
]);

const US_COUNTRY_CODES = new Set([
  "us",
  "usa",
  "united states",
  "united states of america",
  "u.s.",
  "u.s.a.",
]);

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true") {
      return true;
    }
    if (lower === "false") {
      return false;
    }
  }
  return undefined;
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

class CobaltSOSProvider {
  constructor(config = {}) {
    if (typeof config === "string") {
      config = { apiKey: config }; // eslint-disable-line no-param-reassign
    }

    // Lazy load to satisfy TypeScript's NodeNext module expectations.
    // eslint-disable-next-line no-eval
    const cobaltRequire = eval("require");
    const CobaltSOSClient = cobaltRequire(
      "../../api-clients/cobalt-sos-client"
    );

    const clientOptions = {
      pollIntervalMs: config.pollIntervalMs,
      maxPollAttempts: config.maxPollAttempts,
      defaultLiveData:
        typeof config.cacheFirst === "boolean" ? !config.cacheFirst : false,
      enablePolling:
        typeof config.enablePolling === "boolean" ? config.enablePolling : true,
    };

    this.client = new CobaltSOSClient(config.apiKey, clientOptions);
    this.name = "Cobalt Intelligence SOS";
    this.identifier = "cobalt_sos";
    this.enableLiveFallback =
      typeof config.liveFallback === "boolean" ? config.liveFallback : true;
    this.defaultIncludeUccData =
      typeof config.includeUccData === "boolean"
        ? config.includeUccData
        : false;
  }

  isRelevant(business = {}, searchParams = {}) {
    const state = this.resolveState(business, searchParams);
    if (!state) {
      return false;
    }

    const country = this.resolveCountry(business, searchParams);
    if (country && !US_COUNTRY_CODES.has(country)) {
      return false;
    }

    return US_STATE_CODES.has(state);
  }

  async validate(business = {}, searchParams = {}) {
    const businessName = this.resolveBusinessName(business, searchParams);
    if (!businessName) {
      return {
        source: this.identifier,
        found: false,
        error: "Business name is required for Cobalt SOS lookup.",
        timestamp: new Date().toISOString(),
      };
    }

    const state = this.resolveState(business, searchParams);
    if (!state) {
      return {
        source: this.identifier,
        found: false,
        error: "US state or territory is required for Cobalt SOS lookup.",
        timestamp: new Date().toISOString(),
      };
    }

    const addressFilters = this.resolveAddressFilters(business, searchParams);
    const includeUccData =
      typeof searchParams.includeUccData === "boolean"
        ? searchParams.includeUccData
        : this.defaultIncludeUccData;

    const requestPayload = {
      searchQuery: businessName,
      state,
      liveData: false,
      street: addressFilters.street,
      city: addressFilters.city,
      zip: addressFilters.zip,
      uccData: includeUccData,
    };

    let response;
    let attemptedLiveLookup = false;

    try {
      response = await this.client.searchBusiness(requestPayload);
    } catch (error) {
      return this.buildErrorResponse(error);
    }

    if (
      this.enableLiveFallback &&
      response &&
      !response.failed &&
      response.usedCache &&
      (!response.completed || !response.results.length)
    ) {
      attemptedLiveLookup = true;
      try {
        response = await this.client.searchBusiness({
          ...requestPayload,
          liveData: true,
        });
      } catch (error) {
        return this.buildErrorResponse(error, attemptedLiveLookup);
      }
    }

    return this.buildSuccessResponse(
      response,
      businessName,
      state,
      attemptedLiveLookup
    );
  }

  buildErrorResponse(error, attemptedLiveLookup = false) {
    return {
      source: this.identifier,
      found: false,
      error: error.message,
      attemptedLiveLookup,
      timestamp: new Date().toISOString(),
    };
  }

  buildSuccessResponse(response, businessName, state, attemptedLiveLookup) {
    if (!response) {
      return {
        source: this.identifier,
        found: false,
        error: "Empty response from Cobalt SOS API.",
        timestamp: new Date().toISOString(),
      };
    }

    const normalizedResults = Array.isArray(response.results)
      ? response.results.map((result, index) =>
          this.normalizeResult(result, index === 0)
        )
      : [];
    const confidence = this.calculateConfidence(
      normalizedResults,
      businessName
    );
    const ownerCandidates = this.extractOwnerCandidates(normalizedResults);

    return {
      source: this.identifier,
      integration: "cobalt_intelligence",
      provider: this.name,
      found: response.completed && normalizedResults.length > 0,
      pending: response.pending,
      failed: response.failed,
      retryId: response.retryId || null,
      status: response.status || null,
      statusCode: response.statusCode || null,
      nameAvailable:
        typeof response.nameAvailable === "boolean"
          ? response.nameAvailable
          : null,
      results: normalizedResults,
      possibleAlternatives: this.normalizeAlternatives(
        response.possibleAlternatives
      ),
      confidence,
      ownerCandidates,
      topMatch: normalizedResults[0] || null,
      metadata: {
        state,
        pollAttempts: response.pollAttempts || 0,
        durationMs: response.durationMs || null,
        responseLatencyMs: response.responseLatencyMs || null,
        usedCache: !!response.usedCache,
        liveDataRequested: !!response.liveDataRequested,
        attemptedLiveLookup,
        requestId: response.requestId || null,
        message: response.message || null,
        httpStatus: response.httpStatus || null,
        statusCategory: response.statusCategory || null,
        timestamp: response.timestamp || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  normalizeResult(result, isPrimary) {
    const officers = Array.isArray(result.officers)
      ? result.officers.map((officer, index) =>
          this.normalizeOfficer(officer, index)
        )
      : [];

    return {
      primary: !!isPrimary,
      businessName:
        normalizeString(result.title) ||
        normalizeString(result.searchResultTitle),
      legalName: normalizeString(result.searchResultTitle),
      status:
        normalizeString(result.status) ||
        normalizeString(result.normalizedStatus),
      filingDate:
        normalizeString(result.filingDate) ||
        normalizeString(result.normalizedFilingDate),
      inactiveDate: normalizeString(result.inactiveDate),
      nextReportDueDate: normalizeString(result.nextReportDueDate),
      entityType: normalizeString(result.entityType),
      entitySubType: normalizeString(result.entitySubType),
      stateOfFormation: normalizeString(result.stateOfFormation),
      stateOfRegistration: normalizeString(result.stateOfSosRegistration),
      sosId: normalizeString(result.sosId),
      agent: {
        name: normalizeString(result.agentName),
        street: normalizeString(result.agentStreetAddress),
        city: normalizeString(result.agentCity),
        state: normalizeString(result.agentState),
        zip: normalizeString(result.agentZip),
        isCommercial: parseBoolean(result.agentIsCommercial),
        resigned: parseBoolean(result.agentResigned),
        resignedDate: normalizeString(result.agentResignedDate),
      },
      registeredAddress: {
        street: normalizeString(result.physicalAddressStreet),
        city: normalizeString(result.physicalAddressCity),
        state: normalizeString(result.physicalAddressState),
        zip: normalizeString(result.physicalAddressZip),
      },
      mailingAddress: {
        street: normalizeString(result.mailingAddressStreet),
        city: normalizeString(result.mailingAddressCity),
        state: normalizeString(result.mailingAddressState),
        zip: normalizeString(result.mailingAddressZip),
      },
      stateAddress: {
        street: normalizeString(result.stateAddressStreet),
        city: normalizeString(result.stateAddressCity),
        state: normalizeString(result.stateAddressState),
        zip: normalizeString(result.stateAddressZip),
      },
      sopAddress: {
        name: normalizeString(result.sopName),
        street: normalizeString(result.sopStreetAddress),
        city: normalizeString(result.sopCity),
        state: normalizeString(result.sopState),
        zip: normalizeString(result.sopZip),
      },
      contact: {
        phone: normalizeString(result.phoneNumber),
        email: normalizeString(result.email),
        url: normalizeString(result.url),
      },
      financial: {
        ein: normalizeString(result.EIN),
        taxpayerNumber: normalizeString(result.taxPayerNumber),
      },
      confidenceLevel: this.normalizeConfidenceValue(
        result.confidenceLevel,
        result.aiConfidenceLevel
      ),
      aiConfidenceLevel: this.normalizeConfidenceValue(
        result.aiConfidenceLevel
      ),
      addressMatch: parseBoolean(result.addressMatch),
      documents: Array.isArray(result.documents)
        ? result.documents.map((doc) => ({
            name: normalizeString(doc.name),
            url: normalizeString(doc.url),
            date: normalizeString(doc.date),
            comment: normalizeString(doc.comment),
          }))
        : [],
      officers,
      assumedBusinessNames: Array.isArray(result.assumedBusinessNames)
        ? result.assumedBusinessNames.map((nameRecord) => ({
            title: normalizeString(nameRecord.title),
            effectiveDate: normalizeString(nameRecord.effectiveDate),
            status: normalizeString(nameRecord.status),
            type: normalizeString(nameRecord.type),
            expirationDate: normalizeString(nameRecord.expirationDate),
          }))
        : [],
      history: Array.isArray(result.history) ? result.history : [],
      uccData: Array.isArray(result.uccData) ? result.uccData : [],
      sourceUrl: normalizeString(result.url),
      screenshotUrl: normalizeString(result.screenshotUrl),
      raw: result,
    };
  }

  normalizeOfficer(officer, index) {
    const currentValue = parseBoolean(officer.current);
    return {
      index,
      name: normalizeString(officer.name),
      title: normalizeString(officer.title),
      street: normalizeString(officer.streetAddress || officer.street),
      city: normalizeString(officer.city),
      state: normalizeString(officer.state),
      zip: normalizeString(officer.zip),
      phone: normalizeString(officer.phone),
      email: normalizeString(officer.email),
      current: typeof currentValue === "boolean" ? currentValue : undefined,
    };
  }

  normalizeAlternatives(alternatives) {
    if (!Array.isArray(alternatives)) {
      return [];
    }

    return alternatives.map((item) => ({
      businessName: normalizeString(item.businessName),
      status: normalizeString(item.status),
      sosId: normalizeString(item.sosId),
      url: normalizeString(item.url),
      agentName: normalizeString(item.agentName),
      agentTitle: normalizeString(item.agentTitle),
      street: normalizeString(item.street),
      city: normalizeString(item.city),
      state: normalizeString(item.state),
      zip: normalizeString(item.zip),
      confidenceLevel: this.normalizeConfidenceValue(item.confidenceLevel),
      personName: normalizeString(item.personName),
      personTitle: normalizeString(item.personTitle),
    }));
  }

  normalizeConfidenceValue(value, fallback) {
    const primary = safeNumber(value);
    if (primary !== null) {
      return primary <= 1 ? Math.round(primary * 100) : Math.round(primary);
    }

    const secondary = safeNumber(fallback);
    if (secondary !== null) {
      return secondary <= 1
        ? Math.round(secondary * 100)
        : Math.round(secondary);
    }

    return null;
  }

  calculateConfidence(results, targetName) {
    if (!results.length || !targetName) {
      return 0;
    }

    const normalizedTarget = this.sanitizeCandidate(targetName);

    let bestMatch = 0;
    let apiConfidence = 0;

    results.forEach((result) => {
      const candidate = this.sanitizeCandidate(result.businessName || "");

      const similarity = this.stringSimilarity(normalizedTarget, candidate);
      bestMatch = Math.max(bestMatch, similarity);

      const confidenceLevel = safeNumber(result.confidenceLevel);
      if (confidenceLevel !== null) {
        const normalizedConfidence =
          confidenceLevel <= 1 ? confidenceLevel : confidenceLevel / 100;
        apiConfidence = Math.max(apiConfidence, normalizedConfidence);
      }
    });

    const weighted = Math.max(bestMatch, apiConfidence);
    return Math.round(weighted * 100);
  }

  sanitizeCandidate(value) {
    if (!value) {
      return "";
    }

    return value
      .toString()
      .toLowerCase()
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[^\w\s]/g, "")
      .trim();
  }

  stringSimilarity(a, b) {
    if (!a && !b) {
      return 1;
    }
    if (!a || !b) {
      return 0;
    }

    const longer = a.length >= b.length ? a : b;
    const shorter = a.length >= b.length ? b : a;

    if (!longer.length) {
      return 1;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(source, target) {
    const matrix = Array.from({ length: target.length + 1 }, () => []);

    for (let i = 0; i <= target.length; i += 1) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= source.length; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= target.length; i += 1) {
      for (let j = 1; j <= source.length; j += 1) {
        if (target.charAt(i - 1) === source.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[target.length][source.length];
  }

  extractOwnerCandidates(results) {
    const candidates = [];

    results.forEach((result) => {
      if (!Array.isArray(result.officers)) {
        return;
      }

      result.officers.forEach((officer) => {
        if (!officer || !officer.name) {
          return;
        }

        const currentFlag =
          typeof officer.current === "boolean" ? officer.current : undefined;

        candidates.push({
          name: officer.name,
          title: officer.title,
          email: officer.email,
          phone: officer.phone,
          street: officer.street,
          city: officer.city,
          state: officer.state,
          zip: officer.zip,
          current: currentFlag,
          source: this.identifier,
        });
      });
    });

    return candidates;
  }

  resolveBusinessName(business, searchParams) {
    return (
      normalizeString(business.legalName) ||
      normalizeString(business.name) ||
      normalizeString(business.businessName) ||
      normalizeString(searchParams.searchQuery)
    );
  }

  resolveState(business, searchParams) {
    const candidate =
      normalizeString(business.state) ||
      normalizeString(business.region) ||
      normalizeString(business.stateCode) ||
      normalizeString(business.addressState) ||
      normalizeString(searchParams.state);

    if (!candidate) {
      return null;
    }

    const normalized = this.client.normalizeState(candidate);
    return normalized ? normalized.toLowerCase() : null;
  }

  resolveCountry(business, searchParams) {
    const value =
      normalizeString(business.country) ||
      normalizeString(business.countryCode) ||
      normalizeString(searchParams.country);

    return value ? value.toLowerCase() : null;
  }

  resolveAddressFilters(business, searchParams) {
    return {
      street:
        normalizeString(business.street) ||
        normalizeString(business.address) ||
        normalizeString(searchParams.street),
      city:
        normalizeString(business.city) || normalizeString(searchParams.city),
      zip:
        normalizeString(business.zip) ||
        normalizeString(business.postalCode) ||
        normalizeString(searchParams.zip),
    };
  }
}

module.exports = CobaltSOSProvider;
