# Tenant Payments API Requirements

This document outlines all the API endpoints required for the Tenant Payments functionality to work properly. The payments page allows tenants to view their payment history and submit new payment records with receipt attachments.

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

## Required API Endpoints

### 1. Payment Receipt Status API
**Endpoint:** `GET /api/tenants/payment-receipt-status/`

**Purpose:** Get summary statistics of tenant's payment status

**Response Format:**
```json
{
  "total_paid": 5000000,
  "total_pending": 2,
  "total_overdue": 0,
  "payment_rate": 95.5,
  "last_payment_date": "2024-01-15",
  "next_due_date": "2024-02-01",
  "current_balance": 500000
}
```

### 2. My Payments API
**Endpoint:** `GET /api/tenants/my-payments/`

**Purpose:** Get complete payment history for the authenticated tenant

**Response Format:**
```json
[
  {
    "id": "123",
    "amount": 500000,
    "payment_for_month": 1,
    "payment_for_year": 2024,
    "due_date": "2024-01-31",
    "paid_at": "2024-01-28T10:30:00Z",
    "payment_method": "Mobile Money",
    "reference_number": "MM240128001",
    "receipt_file": "https://api.example.com/media/receipts/receipt_123.pdf",
    "acknowledgement_status": "acknowledged",
    "status": "paid",
    "created_at": "2024-01-28T10:30:00Z",
    "updated_at": "2024-01-29T09:15:00Z"
  }
]
```

### 3. Log Payment API
**Endpoint:** `POST /api/tenants/log-payment/`

**Purpose:** Allow tenants to submit payment records with receipt attachments

**Request Format:** `multipart/form-data`
```
amount: 500000
payment_method: Mobile Money
reference_number: MM240128001
payment_for_month: 1
payment_for_year: 2024
due_date: 2024-01-31
notes: Payment for January rent
receipt_file: [FILE]
```

**Response Format:**
```json
{
  "success": true,
  "message": "Payment logged successfully! It will be reviewed by property management.",
  "payment_id": "456",
  "status": "pending_verification"
}
```

### 4. Rent Alerts API
**Endpoint:** `GET /api/tenants/my-rent-alerts/`

**Purpose:** Get upcoming and overdue payment alerts for the tenant

**Response Format:**
```json
{
  "total_upcoming": 1,
  "total_overdue": 0,
  "upcoming_due": [
    {
      "id": "789",
      "amount": 500000,
      "due_date": "2024-02-01",
      "payment_for_month": 2,
      "payment_for_year": 2024,
      "days_until_due": 5,
      "is_urgent": false
    }
  ],
  "overdue": [
    {
      "id": "790",
      "amount": 500000,
      "due_date": "2024-01-01",
      "payment_for_month": 1,
      "payment_for_year": 2024,
      "days_overdue": 15,
      "late_fee": 50000
    }
  ]
}
```

## Payment Status Values

The system uses these status values for payment tracking:

### `status` field:
- `"pending"` - Payment submitted, awaiting verification
- `"processing"` - Payment being verified by management
- `"paid"` - Payment confirmed and processed
- `"overdue"` - Payment past due date
- `"cancelled"` - Payment cancelled or rejected

### `acknowledgement_status` field:
- `"acknowledged"` - Payment verified and acknowledged by management
- `"pending_review"` - Awaiting management review
- `"requires_clarification"` - Additional information needed
- `"rejected"` - Payment rejected (with reason in notes)

## File Upload Requirements

### Receipt File Upload:
- **Supported formats:** `image/*`, `application/pdf`
- **Max file size:** 10MB
- **Storage:** Files should be stored securely with proper access controls
- **URL generation:** Return accessible URLs for file retrieval

### Security Considerations:
1. Validate file types on server-side
2. Scan uploaded files for malware
3. Generate unique filenames to prevent conflicts
4. Store files outside web-accessible directories
5. Implement access controls (tenant can only access their own receipts)

## Error Handling

### Standard Error Response Format:
```json
{
  "error": "Validation failed",
  "details": {
    "amount": ["This field is required"],
    "receipt_file": ["File size too large"]
  },
  "code": "VALIDATION_ERROR"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (not allowed to access resource)
- `413` - Payload Too Large (file size exceeded)
- `422` - Unprocessable Entity (business logic error)
- `500` - Internal Server Error

## Data Validation Rules

### Payment Submission Validation:
```javascript
{
  amount: {
    required: true,
    type: "number",
    min: 1,
    max: 10000000 // 10M UGX
  },
  payment_method: {
    required: true,
    type: "string",
    choices: [
      "Mobile Money",
      "Bank Transfer", 
      "Cash",
      "Credit Card",
      "Debit Card",
      "Cheque"
    ]
  },
  reference_number: {
    required: true,
    type: "string",
    max_length: 100
  },
  payment_for_month: {
    required: true,
    type: "integer",
    min: 1,
    max: 12
  },
  payment_for_year: {
    required: true,
    type: "integer",
    min: 2020,
    max: 2030
  },
  due_date: {
    required: true,
    type: "date",
    format: "YYYY-MM-DD"
  },
  notes: {
    required: false,
    type: "string",
    max_length: 500
  },
  receipt_file: {
    required: false,
    type: "file",
    max_size: "10MB",
    allowed_types: ["image/jpeg", "image/png", "image/gif", "application/pdf"]
  }
}
```

## Business Logic Requirements

### Payment Processing Workflow:
1. **Tenant Submission:** Tenant logs payment with receipt
2. **Initial Validation:** System validates data and file
3. **Storage:** Payment record created with "pending" status
4. **Notification:** Property manager notified of new payment
5. **Verification:** Manager reviews payment and receipt
6. **Status Update:** Payment status updated to "acknowledged" or "rejected"
7. **Tenant Notification:** Tenant notified of status change

### Automatic Status Updates:
- Payments become "overdue" if not marked as paid by due date
- System should calculate `days_overdue` and `days_until_due` dynamically
- Late fees may be applied based on property rules

## Frontend Integration Notes

### Currency Formatting:
```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(Number(amount));
};
```

### Date Handling:
```javascript
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};
```

### Status Color Coding:
```javascript
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'acknowledged':
      return 'bg-green-100 text-green-700';
    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-700';
    case 'overdue':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};
```

## Performance Requirements

### Response Time Targets:
- Payment history: < 800ms
- Payment submission: < 2 seconds
- File upload: < 10 seconds (depending on file size)
- Payment status: < 300ms

### Caching Strategy:
- Payment history: Cache for 5 minutes
- Payment status: No caching (real-time data)
- Static data (payment methods): Cache for 1 hour

## Testing Endpoints

### Sample API Calls:

```bash
# Get payment history
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/tenants/my-payments/

# Get payment status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/tenants/payment-receipt-status/

# Submit payment (with file)
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "amount=500000" \
     -F "payment_method=Mobile Money" \
     -F "reference_number=MM240128001" \
     -F "payment_for_month=1" \
     -F "payment_for_year=2024" \
     -F "due_date=2024-01-31" \
     -F "notes=January rent payment" \
     -F "receipt_file=@receipt.pdf" \
     http://127.0.0.1:8000/api/tenants/log-payment/

# Get rent alerts
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/tenants/my-rent-alerts/
```

## Database Considerations

### Required Models/Tables:
1. **Payments** - Store payment records
2. **PaymentStatuses** - Track status changes
3. **PaymentMethods** - Available payment methods
4. **Tenants** - Tenant information
5. **Leases** - Lease agreements with rent amounts

### Key Relationships:
- Payment belongs to Tenant
- Payment linked to specific month/year
- Payment has status history
- Receipt file stored with payment record

### Recommended Indexes:
```sql
-- For payment queries
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, due_date);
CREATE INDEX idx_payments_status ON payments(status, acknowledgement_status);
CREATE INDEX idx_payments_period ON payments(payment_for_year, payment_for_month);

-- For alerts
CREATE INDEX idx_payments_due_date ON payments(due_date, status);
```

This API structure ensures the Tenant Payments page can provide a complete payment management experience while maintaining data security and performance.
