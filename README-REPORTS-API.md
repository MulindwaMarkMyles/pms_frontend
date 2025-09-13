# Reports Page API Requirements

This document outlines all the API endpoints required for the Reports & Analytics page to function properly. The reports page provides detailed analytics across payments, occupancy, complaints, and tenancy management.

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

## Required API Endpoints

### 1. Payment Report API
**Endpoint:** `GET /api/owner/payment-report/`
**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format

**Response Format:**
```json
{
  "total_payments": 150,
  "total_amount": 75000000,
  "paid_amount": 63750000,
  "pending_amount": 7500000,
  "overdue_amount": 3750000,
  "collection_rate": 85,
  "estates": [
    {
      "estate_id": 1,
      "estate_name": "Sunrise Gardens",
      "payments": 50,
      "total_amount": 25000000,
      "paid_amount": 21250000,
      "pending_amount": 2500000,
      "overdue_amount": 1250000,
      "collection_rate": 85
    }
  ],
  "payment_methods": [
    {
      "method": "Mobile Money",
      "count": 80,
      "total_amount": 40000000
    }
  ],
  "monthly_breakdown": [
    {
      "month": "2024-01",
      "total_payments": 40,
      "total_amount": 20000000,
      "collection_rate": 87
    }
  ]
}
```

### 2. Occupancy Report API
**Endpoint:** `GET /api/owner/occupancy-report/`
**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format

**Response Format:**
```json
{
  "occupancy_trends": [
    {
      "date": "2024-01-01",
      "total_apartments": 150,
      "occupied": 120,
      "vacant": 30,
      "occupancy_rate": 80
    }
  ],
  "estate_breakdown": [
    {
      "estate_id": 1,
      "estate_name": "Sunrise Gardens",
      "avg_occupancy": 82,
      "peak_occupancy": 95,
      "lowest_occupancy": 65,
      "total_apartments": 50,
      "move_ins": 5,
      "move_outs": 3,
      "turnover_rate": 8
    }
  ],
  "summary": {
    "average_occupancy": 78,
    "peak_occupancy": 92,
    "lowest_occupancy": 62,
    "total_apartments": 150,
    "occupied_apartments": 117,
    "vacant_apartments": 33
  }
}
```

### 3. Complaint Report API
**Endpoint:** `GET /api/owner/complaint-report/`
**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format

**Response Format:**
```json
{
  "total_complaints": 45,
  "open_complaints": 8,
  "in_progress_complaints": 12,
  "resolved_complaints": 20,
  "closed_complaints": 5,
  "avg_resolution_time": 3.2,
  "complaint_categories": [
    {
      "category_id": 1,
      "category": "Maintenance",
      "count": 20,
      "resolved": 15,
      "resolution_rate": 75,
      "avg_resolution_time": 2.8
    },
    {
      "category_id": 2,
      "category": "Noise",
      "count": 10,
      "resolved": 8,
      "resolution_rate": 80,
      "avg_resolution_time": 1.5
    }
  ],
  "estates": [
    {
      "estate_id": 1,
      "estate_name": "Sunrise Gardens",
      "total_complaints": 15,
      "resolved_complaints": 12,
      "resolution_rate": 80,
      "avg_resolution_time": 2.5
    }
  ],
  "monthly_breakdown": [
    {
      "month": "2024-01",
      "new_complaints": 12,
      "resolved_complaints": 10,
      "avg_resolution_time": 3.1
    }
  ]
}
```

### 4. Complaint Trends API
**Endpoint:** `GET /api/owner/complaint-trends/`
**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)

**Response Format:**
```json
{
  "new_complaints": 15,
  "resolved_complaints": 12,
  "escalated_complaints": 2,
  "avg_resolution_time": 3.5,
  "resolution_rate": 80,
  "satisfaction_score": 4.2,
  "daily_trends": [
    {
      "date": "2024-01-20",
      "new": 2,
      "resolved": 1,
      "escalated": 0
    }
  ],
  "category_trends": [
    {
      "category": "Maintenance",
      "trend": "increasing",
      "change_percent": 15
    }
  ]
}
```

### 5. Tenants Expiring API
**Endpoint:** `GET /api/owner/tenants-expiring/`
**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format

**Response Format:**
```json
[
  {
    "tenant_id": 123,
    "tenant_name": "John Doe",
    "apartment": "A-101",
    "apartment_id": 45,
    "estate": "Sunrise Gardens",
    "estate_id": 1,
    "lease_start": "2023-02-01",
    "lease_end": "2024-01-31",
    "days_until_expiry": -5,
    "renewal_status": "expired",
    "contact_phone": "+256700000000",
    "contact_email": "john.doe@email.com",
    "rent_amount": 500000,
    "deposit_amount": 1000000,
    "is_renewed": false,
    "renewal_date": null
  }
]
```

### 6. Export Report API (Optional)
**Endpoint:** `POST /api/owner/export-report/`
**Request Body:**
```json
{
  "report_type": "payments", // "payments", "occupancy", "complaints", "tenancy"
  "format": "excel", // "excel", "pdf", "csv"
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "filters": {
    "estate_ids": [1, 2],
    "categories": ["maintenance", "noise"]
  }
}
```

**Response Format:**
```json
{
  "download_url": "https://api.example.com/downloads/report_12345.xlsx",
  "expires_at": "2024-01-21T10:30:00Z",
  "file_size": 2048576,
  "filename": "payment_report_2024_01.xlsx"
}
```

## Error Handling

All endpoints should return standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid date format, missing parameters)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `422` - Unprocessable Entity (invalid date range)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Invalid date range",
  "detail": "End date must be after start date",
  "code": "INVALID_DATE_RANGE",
  "field": "end_date"
}
```

## Data Aggregation Requirements

### Date Range Validation
- `start_date` must be before `end_date`
- Maximum date range: 1 year
- Dates should be in YYYY-MM-DD format
- Default to current month if no dates provided

### Performance Considerations

#### Response Time Targets:
- Payment Report: < 2 seconds
- Occupancy Report: < 1.5 seconds  
- Complaint Report: < 1 second
- Complaint Trends: < 500ms
- Tenants Expiring: < 800ms

#### Optimization Strategies:
- Pre-aggregate monthly/daily summaries where possible
- Use database indexes on date fields and estate relationships
- Implement caching for frequently requested date ranges
- Consider pagination for large datasets

### Data Freshness
- Payment data: Real-time (no caching)
- Occupancy data: Cache for 1 hour
- Complaint data: Cache for 30 minutes
- Trends data: Cache for 15 minutes

## Security & Access Control

### Authorization Rules:
1. **Owner Access**: Can view all estates they own
2. **Manager Access**: Can view specific estates they manage
3. **Data Filtering**: Automatically filter by user's accessible estates
4. **PII Protection**: Mask sensitive tenant information in exports

### Rate Limiting:
- Reports: 20 requests per minute per user
- Exports: 5 requests per minute per user
- Trends: 60 requests per minute per user

## Frontend Integration Notes

### RTK Query Configuration:
The frontend uses conditional queries with the `skip` option to prevent unnecessary API calls:
```typescript
const { data: paymentReport, isLoading } = useGetPaymentReportQuery(
  dateRange, 
  { skip: reportType !== 'payments' }
);
```

### State Management:
- Date range is managed locally and passed to all report queries
- Report type switching prevents unnecessary network requests
- Loading states are handled per report type

### Export Functionality:
The export feature should:
1. Trigger the export API with current filters
2. Show progress indicator during generation
3. Provide download link when ready
4. Handle large file downloads gracefully

## Usage Examples

### Fetch Payment Report
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://127.0.0.1:8000/api/owner/payment-report/?start_date=2024-01-01&end_date=2024-01-31"
```

### Fetch Occupancy Trends
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://127.0.0.1:8000/api/owner/occupancy-report/?start_date=2024-01-01&end_date=2024-01-31"
```

### Export Report
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"report_type":"payments","format":"excel","start_date":"2024-01-01","end_date":"2024-01-31"}' \
     "http://127.0.0.1:8000/api/owner/export-report/"
```

## Database Considerations

### Required Indexes:
```sql
-- For payment reports
CREATE INDEX idx_payments_date_estate ON payments(due_date, estate_id);
CREATE INDEX idx_payments_status_date ON payments(status, created_at);

-- For occupancy reports  
CREATE INDEX idx_tenancy_dates ON tenancies(lease_start, lease_end, apartment_id);

-- For complaint reports
CREATE INDEX idx_complaints_date_category ON complaints(created_at, category_id);
CREATE INDEX idx_complaints_estate_status ON complaints(estate_id, status);
```

### Sample Queries:
The backend should efficiently handle queries like:
- Payment collection rates by estate and time period
- Occupancy trends with move-in/move-out tracking
- Complaint resolution times by category
- Lease expiration forecasting

This API structure ensures the Reports page can provide comprehensive analytics while maintaining good performance and data accuracy for property management decision-making.
