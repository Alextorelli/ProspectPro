# MCP Mode-to-Tool Matrix

| Agent Mode         | Recommended Tools/Scripts                               | Notes                                |
| ------------------ | ------------------------------------------------------- | ------------------------------------ |
| Feature Delivery   | Thunder Client, `npm run supabase:test:db`, Edge deploy | Use for new features, run full suite |
| Smart Debug        | MCP Troubleshooting Server, `test_edge_function`, logs  | For incident response, log analysis  |
| Production Support | `supabase_cli_healthcheck`, `vercel_status_check`       | For uptime, rollback, health checks  |
| API Research       | Thunder Client, MCP API tools                           | For API integration/validation       |
| Cost Optimization  | MCP cost tools, logs, `campaign-validation.sh`          | For budget/cost analysis             |

_Use this as a quick reference when selecting agent mode and corresponding tools._
