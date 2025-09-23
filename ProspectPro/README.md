# ProspectPro

ProspectPro is a lead generation platform built with Node.js and Express, designed to provide high-quality business leads using real data obtained through multiple API integrations. This README provides an overview of the project, setup instructions, and guidelines for contributing.

## Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

ProspectPro implements a zero-tolerance policy for fake data, ensuring that all business leads are verified and enriched through a robust data pipeline. The system integrates with various APIs, including Google Places and Foursquare, to discover and validate business information.

## Core Features

- Multi-source business discovery
- Data enrichment and validation
- Quality scoring for leads
- API integrations for email verification and contact extraction
- Docker support for easy deployment and development

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ProspectPro
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file and configure your environment variables:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Usage

Once the server is running, you can access the API endpoints for business discovery and lead export. Refer to the API documentation for detailed usage instructions.

## Deployment

ProspectPro can be deployed using various platforms. Configuration files for Railway, Render, and Fly.io are included in the `deploy` directory. Use the provided scripts to automate the deployment process.

## Scripts

The following scripts are available for managing the application:

- `scripts/build-and-deploy.sh`: Automates the build and deployment process.
- `scripts/dev-setup.sh`: Sets up the development environment.
- `scripts/migrate-db.sh`: Handles database migrations.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your branch and create a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.