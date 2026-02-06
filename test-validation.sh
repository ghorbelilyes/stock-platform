#!/bin/bash

# Test the validation API with the CSV files
cd /home/ilyes/Desktop/3d-prime/sakai-ng/backend/examples/data2

echo "Testing validation API..."
echo "========================"

curl -X POST "http://localhost:8080/api/files/validate-consistency" \
  -F "stockFile=@c_stock.csv" \
  -F "salesFile=@c_sales.csv" \
  -F "transferFile=@c_transfer.csv" \
  -F 'stockMapping={"fileType":"STOCK","mappings":[{"fileColumn":"id_store","backendColumn":"id_store","required":true},{"fileColumn":"id_product","backendColumn":"id_product","required":true},{"fileColumn":"quantity","backendColumn":"quantity","required":true}]}' \
  -F 'salesMapping={"fileType":"SALES","mappings":[{"fileColumn":"id_store","backendColumn":"id_store","required":true},{"fileColumn":"id_product","backendColumn":"id_product","required":true},{"fileColumn":"quantity","backendColumn":"quantity","required":true},{"fileColumn":"range_date","backendColumn":"range_date","required":true}]}' \
  -F 'transferMapping={"fileType":"TRANSFER","mappings":[{"fileColumn":"date","backendColumn":"date","required":true},{"fileColumn":"id_store_sent","backendColumn":"id_store_sent","required":true},{"fileColumn":"id_store_receive","backendColumn":"id_store_receive","required":true},{"fileColumn":"id_product","backendColumn":"id_product","required":true},{"fileColumn":"reason","backendColumn":"reason","required":true},{"fileColumn":"quantity","backendColumn":"quantity","required":true},{"fileColumn":"status","backendColumn":"status","required":true}]}' \
  | jq '.'
