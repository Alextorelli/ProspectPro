// Tool module for production-server.js
module.exports = {
  healthCheck: () => "Production server health OK",
  diagnostics: () => "Production diagnostics complete",
  // Supabase MCP feature group stubs
  database: () => "Supabase database tools ready",
  functions: () => "Supabase functions tools ready",
  storage: () => "Supabase storage tools ready",
  account: () => "Supabase account tools ready",
  docs: () => "Supabase docs tools ready",
  debugging: () => "Supabase debugging tools ready",
  development: () => "Supabase development tools ready",
  branching: () => "Supabase branching tools ready",
};
