# Owner Dashboard API Requirements

This document outlines all the API endpoints required for the Owner Dashboard to function properly. The dashboard provides comprehensive property management insights including occupancy, payments, complaints, and tenancy data.

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

## Required API Endpoints

### 1. Occupancy Status API
**Endpoint:** `GET /api/owner/occupancy-status/`
**Query Parameters:**
- `estate_id` (optional): Filter by specific estate

**Response Format:**
```json
{
  "total_estates": 5,
  "total_apartments": 150,
  "occupied_apartments": 120,
  "vacant_apartments": 30,
  "occupancy_rate": 80,
  "estates": [
    {
      "estate_id": 1,
      "estate_name": "Sunrise Gardens",
      "total_apartments": 50,
      "occupied_apartments": 40,
      "vacant_apartments": 10,
      "occupancy_rate": 80,
      "blocks": [
        {
          "block_id": 1,
          "block_name": "Block A",
          "total_apartments": 25,
          "occupied_apartments": 20,
          "vacant_apartments": 5,
          "occupancy_rate": 80
        }
      ]
    }
  ]
}
```

### 2. Payment Dashboard Summary API
**Endpoint:** `GET /api/owner/payment-dashboard-summary/`

**Response Format:**
```json
{
  "monthly_revenue": 15000000,
  "payment_rate": 85,
  "paid_payments": 120,
  "pending_payments": 15,
  "overdue_payments": 10,
  "total_expected": 18000000,
  "total_collected": 15300000
}
```

### 3. Estate Payment Status API
**Endpoint:** `GET /api/owner/estate-payment-status/`

**Response Format:**
```json
[
  {
    "estate_id": 1,
    "estate_name": "Sunrise Gardens",
    "total_apartments": 50,
    "occupied_apartments": 40,
    "total_rent_expected": 8000000,
    "rent_collected": 6800000,
    "collection_rate": 85,
    "overdue_count": 5,
    "pending_count": 3
  }
]
```

### 4. Complaint Analytics API
**Endpoint:** `GET /api/owner/complaint-analytics/`

**Response Format:**
```json
{
  "total_complaints": 45,
  "open_complaints": 12,
  "in_progress_complaints": 8,
  "resolved_complaints": 20,
  "closed_complaints": 5,
  "avg_resolution_time": 3.5,
  "complaints_this_month": 15,
  "complaints_by_category": {
    "Maintenance": 20,
    "Noise": 10,
    "Security": 8,
    "Amenities": 7
  }
}
```

### 5. Tenancy Expiry Dashboard API
**Endpoint:** `GET /api/owner/tenancy-expiry-dashboard/`

**Response Format:**
```json
{
  "expiring_this_month": 8,
  "expiring_next_month": 12,
  "renewal_rate": 75,
  "expiring_soon": [
    {
      "tenant_id": 123,
      "tenant_name": "John Doe",
      "apartment": "A-101",
      "estate": "Sunrise Gardens",
      "lease_end": "2024-02-15",
      "days_until_expiry": 25,
      "renewal_status": "pending"
    }
  ],
  "renewed_this_month": 6,
  "vacated_this_month": 2
}
```

### 6. Payment Alerts API
**Endpoint:** `GET /api/owner/payment-alerts/`

**Response Format:**
```json
{
  "overdue_alerts": [
    {
      "tenant_id": 123,
      "tenant_name": "John Doe",
      "apartment": "A-101",
      "estate": "Sunrise Gardens",
      "amount": 500000,
      "due_date": "2024-01-15",
      "days_overdue": 10,
      "payment_method": "Mobile Money"
    }
  ],
  "upcoming_alerts": [
    {
      "tenant_id": 124,
      "tenant_name": "Jane Smith",
      "apartment": "B-202",
      "estate": "Sunset Villa",
      "amount": 600000,
      "due_date": "2024-02-01",
      "days_until_due": 5
    }
  ],
  "recent_payments": [
    {
      "tenant_id": 125,
      "tenant_name": "Bob Johnson",
      "apartment": "C-303",
      "estate": "Garden Heights",
      "amount": 550000,
      "paid_at": "2024-01-20T10:30:00Z"
    }
  ]
}
```

## Error Handling

All endpoints should return standard HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "code": "ERROR_CODE"
}
```

## Data Refresh Strategy

The dashboard implements auto-refresh every 5 minutes for real-time updates. All endpoints should:
- Support efficient caching where appropriate
- Return consistent data formats
- Handle concurrent requests properly
- Include timestamps for data freshness validation

## Performance Considerations

### Recommended Response Times:
- Occupancy Status: < 500ms
- Payment Summary: < 300ms
- Estate Payment Status: < 800ms (may involve complex calculations)
- Complaint Analytics: < 400ms
- Tenancy Expiry: < 600ms
- Payment Alerts: < 200ms (critical for notifications)

### Caching Strategy:
- Occupancy data: Cache for 10 minutes
- Payment summaries: Cache for 5 minutes
- Complaint analytics: Cache for 15 minutes
- Tenancy data: Cache for 30 minutes
- Payment alerts: No caching (real-time)

## Security Requirements

1. **Authentication**: All endpoints require valid Bearer token
2. **Authorization**: Owner-level permissions required
3. **Data Filtering**: Automatically filter data by owner's estates
4. **Rate Limiting**: Implement reasonable rate limits (e.g., 100 requests/minute)
5. **Input Validation**: Validate all query parameters

## Implementation Notes

### Estate Filtering:
When `estate_id` parameter is provided in occupancy status, filter all returned data to that specific estate only. This enables the estate filter dropdown functionality.

### Real-time Updates:
Consider implementing WebSocket connections for critical alerts (overdue payments, new complaints) to provide instant notifications.

### Data Aggregation:
Most endpoints require aggregating data across multiple models (estates, apartments, tenants, payments, complaints). Optimize queries to minimize database load.

### Pagination:
For endpoints returning lists (like payment alerts), implement pagination if the dataset could be large:
```json
{
  "results": [...],
  "count": 150,
  "next": "http://api/endpoint/?page=2",
  "previous": null
}
```

## Testing Endpoints

Use these curl examples to test the API:

```bash
# Get occupancy status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/owner/occupancy-status/

# Get payment summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/owner/payment-dashboard-summary/

# Get estate payment status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/owner/estate-payment-status/

# Get complaint analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/owner/complaint-analytics/

# Get tenancy expiry data
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/owner/tenancy-expiry-dashboard/

# Get payment alerts
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://127.0.0.1:8000/api/owner/payment-alerts/
```

## Frontend Integration

The dashboard uses RTK Query for data fetching. All endpoints are configured in `/src/services/ownerApi.ts` with automatic caching, error handling, and re-fetching capabilities.

Key features:
- Automatic 5-minute refresh intervals
- Manual refresh functionality
- Loading states and error handling
- Estate filtering support
- Real-time data updates

This API structure ensures the Owner Dashboard provides comprehensive, real-time insights into property management operations while maintaining good performance and user experience.
