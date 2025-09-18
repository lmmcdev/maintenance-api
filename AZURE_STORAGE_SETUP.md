# Azure Blob Storage Setup for Attachments

This document explains how to configure Azure Blob Storage for the attachment functionality in the Maintenance API.

## Prerequisites

1. An Azure subscription
2. An Azure Storage Account

## Setup Steps

### 1. Create Azure Storage Account

1. Go to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Storage" → "Storage account"
3. Fill in the required information:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create or select existing
   - **Storage account name**: Choose a unique name (e.g., `maintenanceapistorage`)
   - **Region**: Choose your preferred region
   - **Performance**: Standard
   - **Redundancy**: Locally redundant storage (LRS) for development

### 2. Get Connection String

1. Navigate to your Storage Account in the Azure Portal
2. Go to "Security + networking" → "Access keys"
3. Copy the "Connection string" from key1 or key2

### 3. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Azure Storage Configuration for Attachments
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=yourstorageaccount;AccountKey=youraccountkey;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=maintenance
```

Replace the connection string with the one you copied from the Azure Portal.

### 4. Container Setup

The application will automatically create the `maintenance` container when it starts up. The container will be configured with:
- **Public read access**: Allows direct access to uploaded files
- **Blob naming pattern**: `tickets/{YYYY-MM-DD}/{filename}`

### 5. Security Considerations

For production environments:

1. **Use Azure Key Vault**: Store the connection string in Azure Key Vault instead of environment variables
2. **Configure CORS**: Set up CORS rules if your frontend needs direct access to blobs
3. **Access Policies**: Configure appropriate access policies for different environments
4. **Private Endpoints**: Consider using private endpoints for enhanced security

## File Storage Structure

Files are organized in the blob storage as follows:

```
maintenance/                          ← Azure Container
├── scan0050.pdf                     ← Legacy files (direct in container)
└── tickets/                         ← New organized structure
    ├── 2025-01-18/                  ← Files uploaded on 2025-01-18
    │   ├── maintenance-report.pdf
    │   └── invoice.pdf
    ├── 2025-01-19/                  ← Files uploaded on 2025-01-19
    │   └── photo.jpg
    └── 2025-01-20/                  ← Files uploaded on 2025-01-20
        └── document.docx
```

Example:
```
maintenance/                          ← Container: lmmcaxis/maintenance
├── scan0050.pdf                     ← Legacy: https://.../maintenance/scan0050.pdf
└── tickets/
    └── 2025-01-18/
        └── maintenance-report.pdf   ← New: https://.../maintenance/tickets/2025-01-18/maintenance-report.pdf
```

## API Endpoints

The following endpoints are available for attachment management:

- `POST /api/v1/tickets/{ticketId}/attachments` - Upload file
- `GET /api/v1/tickets/{ticketId}/attachments` - List attachments
- `GET /api/v1/tickets/{ticketId}/attachments/{attachmentId}` - Get attachment metadata
- `GET /api/v1/tickets/{ticketId}/attachments/{attachmentId}/download` - Download file
- `DELETE /api/v1/tickets/{ticketId}/attachments/{attachmentId}` - Delete attachment

## Troubleshooting

### Common Issues

1. **Connection String Invalid**: Ensure the connection string is correctly formatted and contains valid credentials
2. **Container Access**: If you get 404 errors, check that the container exists and has proper access permissions
3. **File Size Limits**: Azure Functions have request size limits (default 100MB)

### Error Messages

- `Azure Storage connection string is required`: Set the `AZURE_STORAGE_CONNECTION_STRING` environment variable
- `Failed to initialize blob storage`: Check your connection string and Azure Storage account status
- `Failed to upload file to storage`: Verify storage account permissions and network connectivity

## Development vs Production

### Development
- Use the standard connection string approach
- Container can have public blob access for easier testing

### Production
- Use managed identities when possible
- Store connection strings in Azure Key Vault
- Configure appropriate access policies and network restrictions
- Monitor storage usage and costs

## Cost Considerations

- **Storage costs**: Based on amount of data stored
- **Transaction costs**: Each upload/download operation has a small cost
- **Bandwidth costs**: Outbound data transfer charges may apply

For current pricing, refer to [Azure Storage Pricing](https://azure.microsoft.com/pricing/details/storage/blobs/).