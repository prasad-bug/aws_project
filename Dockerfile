# Use a lightweight python runtime as base image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Copy the application files to the container
COPY index.html styles.css app.js server.py ./

# Expose the application port
EXPOSE 8000

# Run the python server when the container starts
CMD ["python", "server.py"]
