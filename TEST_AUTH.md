# Prueba de Autenticación Azure AD

## Endpoints para probar:

### 1. Health Pública (sin autenticación)
```bash
curl http://localhost:7071/api/v1/health/public
```
✅ Debería funcionar sin autenticación

### 2. Health Protegida (requiere autenticación)
```bash
curl http://localhost:7071/api/v1/health
```
❌ Debería devolver 401 sin token

### 3. Flujo de Autenticación Completo:

#### Paso 1: Obtener URL de login
```bash
curl http://localhost:7071/api/auth/login
```
Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://login.microsoftonline.com/..."
  }
}
```

#### Paso 2: Navegar a la URL de autorización
- Abre la URL en el navegador
- Inicia sesión con tu cuenta de Azure AD
- Serás redirigido a `/auth/callback` con un código

#### Paso 3: El callback intercambia el código por tokens
La respuesta incluirá:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "idToken": "eyJ...",
    "refreshToken": "...",
    "expiresOn": "2024-01-01T00:00:00.000Z",
    "account": {...}
  }
}
```

#### Paso 4: Usar el token para acceder a rutas protegidas
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:7071/api/v1/health
```

#### Paso 5: Validar token
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:7071/api/auth/validate
```

#### Paso 6: Obtener perfil del usuario
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:7071/api/auth/me
```

#### Paso 7: Refrescar token cuando expire
```bash
curl -X POST http://localhost:7071/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## Configuración Requerida en Azure AD:

1. **Registrar aplicación en Azure AD:**
   - Ve a Azure Portal > Azure Active Directory > App registrations
   - Nueva aplicación
   - Nombre: "Maintenance API"
   - Tipos de cuenta admitidos: según tu necesidad
   - URI de redirección: `http://localhost:7071/api/auth/callback`

2. **Configurar secreto del cliente:**
   - En la aplicación > Certificates & secrets
   - New client secret
   - Copiar el valor del secreto

3. **Configurar permisos:**
   - API permissions > Add permission
   - Microsoft Graph > Delegated permissions
   - User.Read (mínimo)

4. **Variables de entorno (.env):**
```env
AZURE_AD_TENANT_ID=tu-tenant-id
AZURE_AD_CLIENT_ID=tu-application-client-id
AZURE_AD_CLIENT_SECRET=tu-client-secret
AZURE_AD_SCOPES=User.Read
AZURE_AD_REDIRECT_URI=http://localhost:7071/api/auth/callback
AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:7071
```

## Diferencias entre endpoints:

- `/api/v1/health/public` - No requiere autenticación
- `/api/v1/health` - Requiere token válido de Azure AD y muestra info del usuario

## Troubleshooting:

1. **Error 401 en health protegida**: Correcto, necesitas autenticarte primero
2. **Error en callback**: Verifica que el redirect_uri coincida exactamente en Azure AD
3. **Token inválido**: Verifica que el tenant_id y client_id sean correctos
4. **Error CORS**: Configura los orígenes permitidos en Azure Functions si es necesario