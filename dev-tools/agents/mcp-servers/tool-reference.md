# MCP Server Tool Reference

This reference consolidates all MCP tools currently available across the installed servers. Source data originates from `mcp_tools_comprehensive.csv` (2025-10-26). Use this document to understand capabilities when updating the registry, persona instructions, or troubleshooting workflows.

## GitHub MCP Server

| Tool                       | Description                                  | Parameters                                   | Category      |
| -------------------------- | -------------------------------------------- | -------------------------------------------- | ------------- |
| list_workflow_runs         | Lists workflow runs for a repository         | owner, repo, page, perPage                   | Actions       |
| get_workflow_run           | Get details of a specific workflow run       | owner, repo, runId                           | Actions       |
| list_jobs_for_workflow_run | List jobs for a workflow run                 | owner, repo, runId                           | Actions       |
| download_workflow_run_logs | Download logs for a workflow run             | owner, repo, runId                           | Actions       |
| cancel_workflow_run        | Cancel a workflow run                        | owner, repo, runId                           | Actions       |
| rerun_workflow             | Re-run a workflow                            | owner, repo, runId                           | Actions       |
| list_code_scanning_alerts  | List code scanning alerts for a repository   | owner, repo                                  | Code Security |
| get_code_scanning_alert    | Get a code scanning alert                    | owner, repo, alertNumber                     | Code Security |
| update_code_scanning_alert | Update a code scanning alert                 | owner, repo, alertNumber, state              | Code Security |
| get_me                     | Get the authenticated user                   | —                                            | Context       |
| get_user                   | Get a user                                   | username                                     | Context       |
| list_dependabot_alerts     | List Dependabot alerts for a repository      | owner, repo                                  | Dependabot    |
| get_dependabot_alert       | Get a Dependabot alert                       | owner, repo, alertNumber                     | Dependabot    |
| update_dependabot_alert    | Update a Dependabot alert                    | owner, repo, alertNumber, state              | Dependabot    |
| list_issues                | List issues in a repository                  | owner, repo, state, labels, sort             | Issues        |
| get_issue                  | Get an issue                                 | owner, repo, issueNumber                     | Issues        |
| create_issue               | Create an issue                              | owner, repo, title, body, assignees, labels  | Issues        |
| update_issue               | Update an issue                              | owner, repo, issueNumber, title, body, state | Issues        |
| add_issue_comment          | Add a comment to an issue                    | owner, repo, issueNumber, body               | Issues        |
| list_issue_comments        | List comments on an issue                    | owner, repo, issueNumber                     | Issues        |
| list_pull_requests         | List pull requests in a repository           | owner, repo, state, head, base               | Pull Requests |
| get_pull_request           | Get a pull request                           | owner, repo, pullNumber                      | Pull Requests |
| create_pull_request        | Create a pull request                        | owner, repo, title, head, base, body         | Pull Requests |
| update_pull_request        | Update a pull request                        | owner, repo, pullNumber, title, body         | Pull Requests |
| merge_pull_request         | Merge a pull request                         | owner, repo, pullNumber                      | Pull Requests |
| list_pull_request_files    | List files in a pull request                 | owner, repo, pullNumber                      | Pull Requests |
| get_repository             | Get a repository                             | owner, repo                                  | Repositories  |
| list_repositories          | List repositories for the authenticated user | type, sort                                   | Repositories  |
| create_repository          | Create a repository                          | name, description, private                   | Repositories  |
| get_file_contents          | Get file contents                            | owner, repo, path, ref                       | Repositories  |
| create_or_update_file      | Create or update file contents               | owner, repo, path, message, content, sha     | Repositories  |
| list_branches              | List branches                                | owner, repo                                  | Repositories  |
| create_branch              | Create a branch                              | owner, repo, branch, sha                     | Repositories  |
| list_commits               | List commits                                 | owner, repo, sha, since, until               | Repositories  |
| search_repositories        | Search for repositories                      | q, sort, order                               | Repositories  |
| search_code                | Search for code                              | q, repo, filename                            | Repositories  |

## Playwright MCP

| Tool                           | Description                       | Parameters                         | Category             |
| ------------------------------ | --------------------------------- | ---------------------------------- | -------------------- |
| playwright_navigate            | Navigate to a URL                 | url                                | Core Automation      |
| playwright_screenshot          | Take a screenshot                 | name, fullPage                     | Core Automation      |
| playwright_click               | Click an element                  | selector                           | Core Automation      |
| playwright_type                | Type text into an element         | selector, text                     | Core Automation      |
| playwright_fill                | Fill an input field               | selector, value                    | Core Automation      |
| playwright_wait_for_selector   | Wait for a selector to appear     | selector, timeout                  | Core Automation      |
| playwright_wait_for_url        | Wait for URL to match pattern     | urlPattern, timeout                | Core Automation      |
| playwright_get_page_content    | Get page content                  | —                                  | Core Automation      |
| playwright_evaluate            | Execute JavaScript on the page    | script                             | Core Automation      |
| playwright_hover               | Hover over an element             | selector                           | Core Automation      |
| playwright_press               | Press a key                       | selector, key                      | Core Automation      |
| playwright_select_option       | Select an option from a dropdown  | selector, value                    | Core Automation      |
| playwright_check               | Check a checkbox or radio button  | selector                           | Core Automation      |
| playwright_uncheck             | Uncheck a checkbox                | selector                           | Core Automation      |
| playwright_scroll              | Scroll the page                   | selector, behavior                 | Core Automation      |
| playwright_click_at_coordinate | Click at specific coordinates     | x, y                               | Coordinate Actions   |
| playwright_drag_and_drop       | Drag and drop between coordinates | sourceX, sourceY, targetX, targetY | Coordinate Actions   |
| playwright_pdf                 | Generate PDF from page            | path, format, printBackground      | PDF Generation       |
| playwright_new_page            | Create a new tab/page             | —                                  | Tab Management       |
| playwright_close_page          | Close current page                | —                                  | Tab Management       |
| playwright_switch_page         | Switch to a different page        | pageIndex                          | Tab Management       |
| playwright_install_browsers    | Install Playwright browsers       | browsers                           | Browser Installation |
| playwright_expect_visible      | Assert element is visible         | selector                           | Test Assertions      |
| playwright_expect_text         | Assert element contains text      | selector, text                     | Test Assertions      |
| playwright_expect_value        | Assert input has value            | selector, value                    | Test Assertions      |
| playwright_start_tracing       | Start tracing                     | name                               | Tracing              |
| playwright_stop_tracing        | Stop tracing                      | —                                  | Tracing              |

## Context7 MCP

| Tool               | Description                                                                | Parameters                                 | Category      |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------ | ------------- |
| resolve-library-id | Resolves a general library name into a Context7-compatible library ID      | libraryName                                | Documentation |
| get-library-docs   | Fetches documentation for a library using a Context7-compatible library ID | context7CompatibleLibraryID, topic, tokens | Documentation |

## Stripe Agent Toolkit MCP

| Tool                 | Description                     | Parameters                                      | Category      |
| -------------------- | ------------------------------- | ----------------------------------------------- | ------------- |
| balance.read         | Retrieve balance information    | —                                               | Account       |
| coupons.create       | Create a new coupon             | id, percent_off, amount_off, currency, duration | Discounts     |
| coupons.read         | Read coupon information         | id                                              | Discounts     |
| customers.create     | Create a new customer           | email, name, description                        | Customers     |
| customers.read       | Read customer information       | id                                              | Customers     |
| disputes.read        | Read disputes information       | id                                              | Disputes      |
| disputes.update      | Update an existing dispute      | id, evidence                                    | Disputes      |
| documentation.read   | Search Stripe documentation     | query                                           | Documentation |
| invoiceItems.create  | Create a new invoice item       | customer, amount, currency, description         | Invoicing     |
| invoices.create      | Create a new invoice            | customer                                        | Invoicing     |
| invoices.read        | Read invoice information        | id                                              | Invoicing     |
| invoices.update      | Update an existing invoice      | id                                              | Invoicing     |
| paymentIntents.read  | Read payment intent information | id                                              | Payments      |
| paymentLinks.create  | Create a new payment link       | line_items                                      | Payments      |
| prices.create        | Create a new price              | unit_amount, currency, product                  | Products      |
| prices.read          | Read price information          | id                                              | Products      |
| products.create      | Create a new product            | name, description                               | Products      |
| products.read        | Read product information        | id                                              | Products      |
| refunds.create       | Create a new refund             | payment_intent, amount                          | Payments      |
| subscriptions.read   | Read subscription information   | id                                              | Subscriptions |
| subscriptions.update | Update subscription information | id                                              | Subscriptions |

## Postman MCP Server

| Tool                     | Description                                | Parameters                        | Category     |
| ------------------------ | ------------------------------------------ | --------------------------------- | ------------ |
| createCollection         | Create a new collection                    | name, description                 | Collections  |
| createCollectionComment  | Create a comment on a collection           | collectionId, message             | Collections  |
| createCollectionFolder   | Create a folder in a collection            | collectionId, name                | Collections  |
| createCollectionFork     | Fork a collection                          | collectionId                      | Collections  |
| createCollectionRequest  | Create a request in a collection           | collectionId, name, method, url   | Collections  |
| createCollectionResponse | Create a response for a collection request | collectionId, requestId, response | Collections  |
| createEnvironment        | Create an environment                      | name, values                      | Environments |
| createMock               | Create a mock server                       | collectionId, name                | Mocks        |
| createMonitor            | Create a monitor                           | collectionId, name, schedule      | Monitors     |
| createSpec               | Create an API specification                | name, definition                  | API Specs    |
| createWorkspace          | Create a workspace                         | name, type, description           | Workspaces   |
| deleteCollection         | Delete a collection                        | collectionId                      | Collections  |
| deleteEnvironment        | Delete an environment                      | environmentId                     | Environments |
| deleteMock               | Delete a mock server                       | mockId                            | Mocks        |
| deleteMonitor            | Delete a monitor                           | monitorId                         | Monitors     |
| deleteSpec               | Delete an API specification                | specId                            | API Specs    |
| deleteWorkspace          | Delete a workspace                         | workspaceId                       | Workspaces   |
| getCollection            | Get collection details                     | collectionId                      | Collections  |
| getCollections           | List all collections                       | —                                 | Collections  |
| getEnvironment           | Get environment details                    | environmentId                     | Environments |
| getEnvironments          | List all environments                      | —                                 | Environments |
| getMock                  | Get mock server details                    | mockId                            | Mocks        |
| getMocks                 | List all mock servers                      | —                                 | Mocks        |
| getMonitor               | Get monitor details                        | monitorId                         | Monitors     |
| getMonitors              | List all monitors                          | —                                 | Monitors     |
| getSpec                  | Get API specification details              | specId                            | API Specs    |
| getAllSpecs              | List all API specifications                | —                                 | API Specs    |
| getWorkspace             | Get workspace details                      | workspaceId                       | Workspaces   |
| getWorkspaces            | List all workspaces                        | —                                 | Workspaces   |
| updateCollection         | Update a collection                        | collectionId, name, description   | Collections  |
| updateEnvironment        | Update an environment                      | environmentId, name, values       | Environments |
| updateMock               | Update a mock server                       | mockId, name, config              | Mocks        |
| updateMonitor            | Update a monitor                           | monitorId, name, schedule         | Monitors     |
| runMonitor               | Run a monitor                              | monitorId                         | Monitors     |

## Sequential Thinking MCP

| Tool                | Description                                                                            | Parameters                                                                                                                           | Category  |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| sequential_thinking | Facilitates a detailed, step-by-step thinking process for problem-solving and analysis | thought, nextThoughtNeeded, thoughtNumber, totalThoughts, isRevision, revisesThought, branchFromThought, branchId, needsMoreThoughts | Cognitive |

## Memory MCP

| Tool                | Description                                         | Parameters   | Category        |
| ------------------- | --------------------------------------------------- | ------------ | --------------- |
| create_entities     | Create multiple new entities in the knowledge graph | entities     | Knowledge Graph |
| create_relations    | Create multiple new relations between entities      | relations    | Knowledge Graph |
| add_observations    | Add new observations to existing entities           | observations | Knowledge Graph |
| delete_entities     | Remove entities and their relations                 | entityNames  | Knowledge Graph |
| delete_observations | Remove specific observations from entities          | deletions    | Knowledge Graph |
| delete_relations    | Remove specific relations from the graph            | relations    | Knowledge Graph |
| read_graph          | Read the entire knowledge graph                     | —            | Knowledge Graph |
| search_nodes        | Search for nodes based on query                     | query        | Knowledge Graph |
| open_nodes          | Retrieve specific nodes by name                     | names        | Knowledge Graph |

## Usage Notes

- The table is intended as a quick lookup; refer to each server's README or source for implementation details.
- Parameters marked with "—" indicate no arguments are required.
- Keep this file synchronized whenever the MCP registry changes or new tools are added.
