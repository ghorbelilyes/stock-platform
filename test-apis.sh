#!/bin/bash

echo "Testing Sales API..."
echo "===================="
curl -s "http://localhost:8080/api/sales?page=0&size=20" | jq '.' || echo "Error or jq not installed"
echo ""
echo ""

echo "Testing Transfers API..."
echo "======================="
curl -s "http://localhost:8080/api/transfers?page=0&size=20&sort=idStoreSent,asc" | jq '.' || echo "Error or jq not installed"
echo ""
echo ""

echo "Testing Sales API with date filters..."
echo "======================================="
curl -s "http://localhost:8080/api/sales?page=0&size=20&startDate=2025-01-01&endDate=2025-12-31" | jq '.' || echo "Error or jq not installed"
echo ""
echo ""

echo "Testing Transfers API with date filters..."
echo "==========================================="
curl -s "http://localhost:8080/api/transfers?page=0&size=20&startDate=2025-01-01&endDate=2025-12-31" | jq '.' || echo "Error or jq not installed"
