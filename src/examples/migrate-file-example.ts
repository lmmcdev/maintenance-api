import { FileMigrationService } from '../services/file-migration.service';
import { AttachmentRef } from '../modules/attachment/attachment.dto';

async function migrateExample() {
  // Tu archivo legacy
  const legacyAttachment: AttachmentRef = {
    id: "JTJmbWFpbnRlbmFuY2UlMmYxNzg2NjUxNjQ1NS0wOTE4LTE1MjQ0Ny5tcDM=",
    filename: "17866516455-0918-152447.mp3",
    contentType: "audio/m4a", // Será corregido a "audio/mpeg"
    size: 32077,
    url: "https://lmmcaxis.blob.core.windows.net/maintenance/17866516455-0918-152447.mp3"
  };

  const migrationService = new FileMigrationService();
  await migrationService.init();

  try {
    // Migrar archivo a nueva estructura
    const migratedAttachment = await migrationService.migrateAttachment(
      legacyAttachment,
      'ticket-id-here', // ID del ticket
      '2025-09-18' // Fecha target (opcional, usa fecha actual si no se especifica)
    );

    console.log('Archivo migrado exitosamente:');
    console.log({
      oldUrl: legacyAttachment.url,
      newUrl: migratedAttachment.url,
      newPath: migratedAttachment.folderPath,
      correctedContentType: migratedAttachment.contentType
    });

    // El archivo nuevo estará en:
    // https://lmmcaxis.blob.core.windows.net/maintenance/tickets/2025-09-18/17866516455-0918-152447.mp3

  } catch (error) {
    console.error('Error en migración:', error);
  }
}

// Para usar en tu código:
export { migrateExample };