# Locations API - Microservicio

## 📋 Overview

API independiente para gestionar ubicaciones/centros que solicitan mantenimientos. Este servicio será consumido por múltiples aplicaciones.

## 🎯 **Casos de Uso**

### **Para Maintenance API:**

- Obtener información de centros que solicitan mantenimiento
- Validar ubicaciones en tickets
- Mostrar datos de contacto y dirección

### **Para otras aplicaciones:**

- Directorio de ubicaciones corporativas
- Gestión de inventario por ubicación
- Reporting y analytics por centro
- Aplicaciones móviles de técnicos

## 🏛️ **Arquitectura Propuesta**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Maintenance    │    │   Inventory     │    │   Mobile App    │
│      API        │    │      API        │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────┬───────────┴──────────────────────┘
                     │
          ┌─────────────────────┐
          │   Locations API     │
          │                     │
          │  - CRUD Operations  │
          │  - Search & Filter  │
          │  - Geographic Ops   │
          │  - Business Hours   │
          └─────────────────────┘
```

## 🔗 **Endpoints Requeridos**

### **Core CRUD**

- `GET /api/v1/locations` - Lista todas las ubicaciones
- `GET /api/v1/locations/{id}` - Obtiene ubicación específica
- `POST /api/v1/locations` - Crea nueva ubicación
- `PUT /api/v1/locations/{id}` - Actualiza ubicación
- `DELETE /api/v1/locations/{id}` - Elimina ubicación

### **Búsqueda y Filtrado**

- `GET /api/v1/locations/search?q={term}` - Búsqueda por texto
- `GET /api/v1/locations?city={city}` - Filtrar por ciudad
- `GET /api/v1/locations?state={state}` - Filtrar por estado
- `GET /api/v1/locations?active=true` - Solo ubicaciones activas
- `GET /api/v1/locations?tags={tag1,tag2}` - Filtrar por tags

### **Operaciones Geográficas**

- `GET /api/v1/locations/nearby?lat={lat}&lon={lon}&radius={km}` - Búsqueda por proximidad
- `GET /api/v1/locations/by-region?region={region}` - Por región

### **Gestión de Estado**

- `POST /api/v1/locations/{id}/activate` - Activar ubicación
- `POST /api/v1/locations/{id}/deactivate` - Desactivar ubicación
- `GET /api/v1/locations/{id}/status` - Estado de ubicación

### **Tags y Metadatos**

- `POST /api/v1/locations/{id}/tags` - Agregar tags
- `DELETE /api/v1/locations/{id}/tags/{tag}` - Remover tag

### **Integración**

- `GET /api/v1/locations/references` - Referencias ligeras para otras APIs
- `POST /api/v1/locations/validate` - Validar IDs de ubicaciones

## 📊 **Modelo de Datos**

```typescript
interface Location {
  id: string;
  name: string;
  description?: string;

  // Contacto
  phoneNumber?: string;
  email?: string;
  contactPerson?: string;

  // Dirección
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;

  // Coordenadas
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Configuración
  isActive: boolean;
  timezone: string;

  // Horarios
  operatingHours?: {
    [day: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };

  // Metadatos
  tags: string[];
  notes?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Referencia ligera para otras APIs
interface LocationReference {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phoneNumber?: string;
}
```

## 🛠️ **Stack Tecnológico Recomendado**

### **Opción 1: Node.js + Azure Functions** (Consistencia)

- **Runtime**: Node.js 18+ TypeScript
- **Framework**: Azure Functions v4
- **Base de datos**: Azure Cosmos DB
- **Autenticación**: Azure AD (misma configuración)
- **Deployment**: Azure Functions

## 🔐 **Seguridad**

- **Autenticación**: Azure AD B2B para aplicaciones corporativas
- **Autorización**: Role-based access control (RBAC)
- **API Keys**: Para aplicaciones externas/móviles
- **Rate Limiting**: Por aplicación/usuario
- **CORS**: Configurado para dominios autorizados

## 📈 **Consideraciones de Escalabilidad**

- **Caching**: Redis para consultas frecuentes
- **CDN**: Para datos estáticos de ubicaciones
- **Indexing**: Índices geográficos para búsquedas espaciales
- **Read Replicas**: Para consultas de solo lectura
- **Event Streaming**: Publicar cambios via Azure Service Bus

## 🚀 **Plan de Implementación**

1. **Fase 1**: API básica con CRUD
2. **Fase 2**: Búsqueda y filtrado
3. **Fase 3**: Funcionalidades geográficas
4. **Fase 4**: Integración con maintenance-api
5. **Fase 5**: Optimizaciones y caching

## 💾 **Integración con Maintenance API**

```typescript
// En maintenance-api, llamadas HTTP a locations-api
class LocationsClient {
  async getLocation(id: string): Promise<LocationReference> {
    const response = await fetch(`${LOCATIONS_API_BASE}/locations/${id}`);
    return response.json();
  }

  async validateLocation(id: string): Promise<boolean> {
    const response = await fetch(`${LOCATIONS_API_BASE}/locations/${id}/validate`);
    return response.ok;
  }
}
```
