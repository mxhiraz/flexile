import { db } from "@test/db";
import { companiesFactory } from "@test/factories/companies";
import { usersFactory } from "@test/factories/users";
import { eq } from "drizzle-orm";
import { DocumentType } from "@/db/enums";
import { companyAdministrators, documents, documentSignatures, users } from "@/db/schema";
import { assert } from "@/utils/assert";

type CreateOptions = {
  signed?: boolean;
};

export const documentsFactory = {
  create: async (overrides: Partial<typeof documents.$inferInsert> = {}, options: CreateOptions = {}) => {
    const user = overrides.userId
      ? ((await db.query.users.findFirst({ where: eq(users.id, overrides.userId) })) ??
        (() => {
          throw new Error(`User with id ${overrides.userId} not found`);
        })())
      : (await usersFactory.create()).user;

    const [document] = await db
      .insert(documents)
      .values({
        companyId: overrides.companyId || (await companiesFactory.create()).company.id,
        userId: user.id,
        name: "Consulting Agreement",
        type: DocumentType.ConsultingContract,
        completedAt: options.signed ? new Date() : null,
        year: new Date().getFullYear(),
        ...overrides,
      })
      .returning();
    assert(document !== undefined);

    if (options.signed) {
      if (document.companyAdministratorId) {
        const companyAdministrator = await db.query.companyAdministrators.findFirst({
          where: eq(companyAdministrators.id, document.companyAdministratorId),
        });
        assert(companyAdministrator !== undefined);
        await db.insert(documentSignatures).values({
          userId: companyAdministrator.userId,
          documentId: document.id,
        });
      }

      await db.insert(documentSignatures).values({
        documentId: document.id,
        userId: user.id,
      });
    }

    return { document };
  },

  createSigned: async (
    overrides: Partial<typeof documents.$inferInsert> = {},
    options: CreateOptions = { signed: true },
  ) => documentsFactory.create(overrides, options),

  createUnsigned: async (
    overrides: Partial<typeof documents.$inferInsert> = {},
    options: CreateOptions = { signed: false },
  ) => documentsFactory.create(overrides, options),

  createTaxDocument: async (overrides: Partial<typeof documents.$inferInsert> = {}) => {
    const { document } = await documentsFactory.create({
      name: "W-9",
      ...overrides,
      type: DocumentType.TaxDocument,
    });
    return { document };
  },
};
