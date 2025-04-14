# Log Analysis Application - Deployment Guide

This document provides instructions for deploying the Log Analysis Application in different environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment with Kubernetes](#production-deployment-with-kubernetes)
4. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have the following tools installed:

- Docker and Docker Compose (for local development)
- Kubernetes cluster (for production deployment)
- kubectl CLI
- GitHub account (for CI/CD pipeline)

## Local Development Setup

For local development, we use Docker Compose to set up the entire stack including MongoDB, Elasticsearch, and the application itself.

### Steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/log-analysis-app.git
   cd log-analysis-app
   ```

2. Start the application stack:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:5000
   - Elasticsearch: http://localhost:9200
   - MongoDB: mongodb://localhost:27017 (requires authentication)

4. Stop the application:
   ```bash
   docker-compose down
   ```

## Production Deployment with Kubernetes

For production deployment, we use Kubernetes to orchestrate the application components.

### Steps:

1. Create a Kubernetes namespace:
   ```bash
   kubectl apply -f kubernetes/manifests.yaml
   ```

2. Verify the deployment:
   ```bash
   kubectl get pods -n log-analysis-app
   ```

3. Access the application:
   - The application will be available at the domain configured in the Ingress resource (log-analysis.example.com by default)
   - Update your DNS settings to point to the Ingress controller's external IP

### Configuration

The Kubernetes deployment uses the following resources:
- Namespace: `log-analysis-app`
- Secrets: `mongodb-secret` and `app-secret`
- PersistentVolumeClaims: For MongoDB and Elasticsearch data
- Deployments: For MongoDB, Elasticsearch, and the Log Analysis Application
- Services: For internal communication between components
- Ingress: For external access to the application

## CI/CD Pipeline Configuration

The application includes a GitHub Actions workflow for continuous integration and deployment.

### Setup:

1. Add the following secrets to your GitHub repository:
   - `DOCKER_HUB_USERNAME`: Your Docker Hub username
   - `DOCKER_HUB_TOKEN`: Your Docker Hub access token
   - `KUBE_CONFIG`: Base64-encoded Kubernetes configuration file

2. Push to the main branch to trigger the CI/CD pipeline:
   - The pipeline will run tests
   - Build and push a Docker image
   - Deploy to Kubernetes

### Pipeline Stages:

1. **Test**: Runs frontend and backend tests
2. **Build and Push**: Builds the Docker image and pushes it to Docker Hub
3. **Deploy**: Updates the Kubernetes deployment with the new image

## Monitoring and Alerting

The application includes Prometheus monitoring configuration for observability.

### Setup:

1. Install Prometheus Operator in your Kubernetes cluster:
   ```bash
   kubectl apply -f https://github.com/prometheus-operator/prometheus-operator/releases/download/v0.59.1/bundle.yaml
   ```

2. Apply the monitoring configuration:
   ```bash
   kubectl apply -f kubernetes/monitoring.yaml
   ```

### Alerts:

The monitoring configuration includes the following alerts:
- **HighErrorRate**: Triggers when the error rate exceeds 5% for 5 minutes
- **HighResponseTime**: Triggers when the 95th percentile response time exceeds 2 seconds for 5 minutes
- **HighCPUUsage**: Triggers when CPU usage exceeds 80% for 5 minutes
- **HighMemoryUsage**: Triggers when memory usage exceeds 80% for 5 minutes

## Troubleshooting

### Common Issues:

1. **Application not starting**:
   - Check the logs: `kubectl logs -n log-analysis-app deployment/log-analysis-app`
   - Verify MongoDB and Elasticsearch are running: `kubectl get pods -n log-analysis-app`

2. **Cannot connect to Elasticsearch**:
   - Check Elasticsearch logs: `kubectl logs -n log-analysis-app deployment/elasticsearch`
   - Verify the Elasticsearch service is running: `kubectl get svc -n log-analysis-app elasticsearch`

3. **CI/CD pipeline failing**:
   - Check GitHub Actions logs for detailed error messages
   - Verify the required secrets are correctly configured

4. **Monitoring not working**:
   - Verify Prometheus Operator is installed
   - Check if ServiceMonitor is correctly configured: `kubectl get servicemonitor -n log-analysis-app`
