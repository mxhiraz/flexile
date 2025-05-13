import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { assert } from "@/utils/assert";

export default inngest.createFunction({ id: "docuseal-webhook" }, { event: "docuseal.webhook" }, async ({ event }) => {
  const data = event.data.data;
  const document = await db.query.documents.findFirst({
    where: eq(documents.docusealSubmissionId, Number(data.submission_id)),
  });
  assert(document != null, "Document not found");
  const user = await db.query.users.findFirst({ where: eq(users.id, BigInt(data.application_key)) });
  assert(user != null, "User not found");
  await db
    .update(documents)
    .set({
      [data.role === "Company Representative" ? "administratorSignature" : "contractorSignature"]: user.legalName,
      completedAt: document[data.role === "Company Representative" ? "contractorSignature" : "administratorSignature"]
        ? new Date()
        : undefined,
    })
    .where(eq(documents.id, document.id));
});
