import { randomUUID } from 'node:crypto'
import { faker } from '@faker-js/faker'
import type { Document } from '../generated/prisma/index.js'

export class DocumentFactory {
  private static counter = 0

  private static generateDefaults(folderId: string, uploadedById: string): Document {
    const idx = ++DocumentFactory.counter
    const name = faker.system.fileName()
    return {
      id: randomUUID(),
      name,
      title: faker.lorem.sentence({ min: 3, max: 6 }),
      description: faker.lorem.sentence({ min: 5, max: 12 }),
      tags: faker.helpers.arrayElements(
        ['tax', 'legal', 'medical', 'finance', 'personal', 'school', 'receipt', 'contract'],
        { min: 1, max: 3 },
      ),
      folderId,
      fileKey: `documents/${idx}/${name}`,
      mimeType: 'application/pdf',
      sizeBytes: faker.number.int({ min: 1024, max: 5 * 1024 * 1024 }),
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      allowedUserIds: [],
      uploadedById,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  private _document: Document

  constructor(folderId: string, uploadedById: string, overrides: Partial<Document> = {}) {
    this._document = { ...DocumentFactory.generateDefaults(folderId, uploadedById), ...overrides }
  }

  get document(): Document {
    return this._document
  }

  public static resetCounter() {
    DocumentFactory.counter = 0
  }
}
