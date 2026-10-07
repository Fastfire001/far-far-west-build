FROM python:3.12-slim

WORKDIR /app
COPY scripts/ scripts/

# The scripts only use the standard library, so there is nothing to install.
