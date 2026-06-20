# ChargingGrid EV Charging Network Cloud Web Application

An interactive, premium web-based dashboard and administration console for the **ChargingGrid EV Charging Network Cloud**. This project demonstrates key cloud engineering and infrastructure concepts:
- **Cloud VPC Networking Layout**: Interactive Multi-AZ subnets, Load Balancer, ECS container tasks, and RDS databases.
- **RDS Database Operations**: Interactive tables tracking transactions, backups, and data insertions.
- **Linux & Container Administration**: SSH command executor and automation script suites.
- **Live CloudWatch Telemetry**: Graphs for CPU, RAM, and network bandwidth tracking.
- **AWS Cost Calculator**: Slide tool to optimize infrastructure costs and configure redundancy SLAs.
- **RBAC Security Layers**: Swappable user access profiles.

## CI/CD Pipeline

The project includes a GitHub Actions workflow `.github/workflows/deploy.yml` which automatically:
1. Builds the application container using the `Dockerfile`.
2. Pushes the built container to the **GitHub Container Registry (GHCR)**.
3. Transits the `docker-compose.yml` configuration to the target AWS EC2 instance.
4. Accesses the EC2 instance via SSH to pull the container and execute `docker compose up -d` without cloning the codebase.
