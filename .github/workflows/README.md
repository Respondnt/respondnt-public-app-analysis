# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated deployment.

## deploy.yml

Automatically builds and deploys the application to GitHub Pages when changes are pushed to the `main` branch.

The workflow:
1. Checks out the code
2. Sets up Node.js
3. Installs dependencies
4. Builds the application
5. Copies data files to the dist directory
6. Deploys to GitHub Pages

Make sure GitHub Pages is enabled in your repository settings with the "GitHub Actions" source option.

