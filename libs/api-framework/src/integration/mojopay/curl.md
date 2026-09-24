# MojoPay — collection init payment

Pushes a MoMo prompt to the customer's phone. A `statusCode` of `CL-00-REQUEST-SUBMITTED`
means the request was accepted.

```bash
curl -X POST 'https://api.cs-pay.app/v3/api/payments/initpayment' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Basic Mzk3OTk3MTc2OTo0NjI2NTE0Nw==' \
  -d '{
    "CustomerName": "Test Donor",
    "Network": "MTN",
    "Mobile": "+233543460633",
    "Email": "test@example.com",
    "Currency": "GHS",
    "CountryCode": "GHA",
    "Amount": 1,
    "OrderId": "TEST-ORDER-0001",
    "OrderDesc": "Test donation"
  }'
```

The `Authorization` value is `base64("3979971769:46265147")` — equivalently
`-u '3979971769:46265147'`.