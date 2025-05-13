#!/bin/bash

# Script to run the tests with Vitest

# Run tests once
echo "Running tests..."
npx vitest run

# Run tests with coverage
echo "Running tests with coverage..."
npx vitest run --coverage