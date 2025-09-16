import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPayload {
  sub: string;
  oid: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  roles?: string[];
  groups?: string[];
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

/**
 * Genera un token JWT de prueba para desarrollo local
 * ADVERTENCIA: Solo usar en desarrollo, nunca en producción
 */
export function generateDevToken(payload: Partial<TokenPayload> = {}): string {
  // Clave secreta solo para desarrollo
  const DEV_SECRET = process.env.DEV_JWT_SECRET || 'dev-secret-key-never-use-in-production';

  const now = Math.floor(Date.now() / 1000);

  const defaultPayload: TokenPayload = {
    sub: crypto.randomUUID(),
    oid: crypto.randomUUID(),
    email: 'test.user@example.com',
    preferred_username: 'test.user@example.com',
    name: 'Test User',
    roles: ['authenticated'],
    groups: [],
    iss: 'https://localhost:7100/dev',
    aud: 'dev-audience',
    iat: now,
    exp: now + (24 * 60 * 60), // 24 horas
    ...payload
  };

  return jwt.sign(defaultPayload, DEV_SECRET, { algorithm: 'HS256' });
}

/**
 * Genera un token con el grupo de mantenimiento específico
 */
export function generateMaintenanceToken(
  groupId: string = 'fee1ecaa-9c28-4d26-a93e-7a9b2614d246',
  email: string = 'maintenance.user@example.com'
): string {
  return generateDevToken({
    email,
    preferred_username: email,
    name: 'Maintenance User',
    roles: ['authenticated', 'maintenance'],
    groups: [groupId]
  });
}

/**
 * Genera un token de admin con todos los permisos
 */
export function generateAdminToken(email: string = 'admin@example.com'): string {
  return generateDevToken({
    email,
    preferred_username: email,
    name: 'Admin User',
    roles: ['authenticated', 'admin'],
    groups: ['fee1ecaa-9c28-4d26-a93e-7a9b2614d246', 'admin-group']
  });
}

/**
 * Imprime tokens de prueba en la consola
 */
export function printDevTokens(): void {
  console.log('\n=== TOKENS DE DESARROLLO ===');
  console.log('⚠️  SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN ⚠️\n');

  console.log('🔑 Token básico (solo autenticado):');
  console.log(`Bearer ${generateDevToken()}\n`);

  console.log('🛠️  Token de mantenimiento:');
  console.log(`Bearer ${generateMaintenanceToken()}\n`);

  console.log('👑 Token de admin:');
  console.log(`Bearer ${generateAdminToken()}\n`);

  console.log('📋 Uso en curl:');
  console.log(`curl -H "Authorization: Bearer ${generateMaintenanceToken()}" http://localhost:7071/api/v1/health\n`);
}

/**
 * Valida si el entorno es de desarrollo
 */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === 'development' ||
         process.env.NODE_ENV === 'dev' ||
         !process.env.NODE_ENV;
}

// Script para ejecutar y generar tokens
if (require.main === module) {
  if (isDevEnvironment()) {
    printDevTokens();
  } else {
    console.error('⚠️  Este script solo puede ejecutarse en entorno de desarrollo');
  }
}