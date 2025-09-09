# Sistema de Notas para Tickets

## 📝 Descripción

El sistema de notas permite agregar múltiples observaciones y comentarios a cada ticket, con información detallada sobre cuándo y por quién fueron creadas.

## 📋 Estructura de Nota

```typescript
interface TicketNote {
  id: string;                    // ID único de la nota
  content: string;              // Contenido de la nota
  type: 'general'               // Tipos disponibles:
      | 'cancellation'          // - general: Nota general
      | 'status_change'         // - cancellation: Nota de cancelación
      | 'assignment'            // - status_change: Cambio de estado
      | 'resolution';           // - assignment: Asignación
  createdAt: string;            // - resolution: Resolución
  createdBy?: string;           // ID del usuario que creó la nota
  createdByName?: string;       // Nombre del usuario
}
```

## 🔄 Migración para Tickets Existentes

Si tienes tickets existentes que fueron creados antes de implementar el sistema de notas, ejecuta esta migración:

```bash
POST /api/v1/tickets/migrate/notes
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 25,
    "migratedTickets": 25,
    "message": "Notes migration completed successfully"
  }
}
```

## 🔗 Endpoints Disponibles

### 1. Agregar Nota a Ticket
```bash
POST /api/v1/tickets/{id}/notes
```

**Body:**
```json
{
  "content": "Esta es una nota de ejemplo",
  "type": "general",
  "createdBy": "user-id",
  "createdByName": "Juan Pérez"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "ticketId": "ticket-id",
    "notesCount": 3,
    "lastNote": {
      "id": "note-id",
      "content": "Esta es una nota de ejemplo",
      "type": "general",
      "createdAt": "2025-01-09T12:30:00.000Z",
      "createdBy": "user-id",
      "createdByName": "Juan Pérez"
    },
    "message": "Note added successfully"
  }
}
```

### 2. Obtener Notas de Ticket
```bash
GET /api/v1/tickets/{id}/notes
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "ticketId": "ticket-id",
    "notes": [
      {
        "id": "note-3",
        "content": "Ticket cancelado por falta de información",
        "type": "cancellation",
        "createdAt": "2025-01-09T14:00:00.000Z",
        "createdBy": "admin-id",
        "createdByName": "Admin"
      },
      {
        "id": "note-2",
        "content": "Se requiere más información del cliente",
        "type": "general",
        "createdAt": "2025-01-09T13:30:00.000Z"
      }
    ],
    "totalCount": 2
  }
}
```

### 3. Cancelar Ticket con Razón
```bash
POST /api/v1/tickets/{id}/cancel
```

**Body (opcional):**
```json
{
  "reason": "Cliente no responde después de múltiples intentos de contacto",
  "cancelledBy": "user-id",
  "cancelledByName": "Operador 1"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "ticket-id",
    "status": "CANCELLED",
    "closedAt": "2025-01-09T14:00:00.000Z",
    "notes": [
      {
        "id": "new-note-id",
        "content": "Cliente no responde después de múltiples intentos de contacto",
        "type": "cancellation",
        "createdAt": "2025-01-09T14:00:00.000Z",
        "createdBy": "user-id",
        "createdByName": "Operador 1"
      }
    ],
    "message": "Ticket cancelled successfully"
  }
}
```

## 💡 Casos de Uso

### 1. Agregar Nota General
```javascript
const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/notes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: "Cliente confirma que el problema persiste",
    type: "general",
    createdBy: currentUserId,
    createdByName: currentUserName
  })
});
```

### 2. Cancelar con Razón
```javascript
const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/cancel`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reason: "Duplicado del ticket #12345",
    cancelledBy: currentUserId,
    cancelledByName: currentUserName
  })
});
```

### 3. Ver Historial de Notas
```javascript
const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/notes`);
const { data } = await response.json();
console.log(`Ticket tiene ${data.totalCount} notas`);
data.notes.forEach(note => {
  console.log(`[${note.type}] ${note.content} - ${note.createdByName}`);
});
```

## 🎯 Beneficios

1. **Trazabilidad**: Cada cambio queda documentado con timestamp y autor
2. **Categorización**: Las notas se clasifican por tipo para mejor organización  
3. **Historial completo**: Se mantiene un registro completo de todas las acciones
4. **Flexibilidad**: Permite agregar contexto a cualquier operación del ticket
5. **Auditoria**: Facilita el seguimiento y análisis de procesos

## 📊 Tipos de Nota

- **general**: Observaciones generales, comentarios del técnico
- **cancellation**: Razones de cancelación del ticket
- **status_change**: Documentación de cambios de estado
- **assignment**: Notas sobre asignaciones de personal
- **resolution**: Detalles sobre la resolución del problema