import { TRPCError } from "@trpc/server";
import { isFuture } from "date-fns";
import { and, desc, eq, exists, isNotNull, isNull, or, sql } from "drizzle-orm";

import { pick } from "lodash-es";
import { z } from "zod";
import { byExternalId, db } from "@/db";
import { DocumentTemplateType, DocumentType, PayRateType } from "@/db/enums";
import {
  companyContractors,
  documents,
  documentSignatures,
  documentTemplates,
  equityAllocations,
  payRates,
  users,
} from "@/db/schema";
import env from "@/env";
import { companyProcedure, createRouter } from "@/trpc";
import { sendEmail } from "@/trpc/email";
import { createSubmission } from "@/trpc/routes/documents/templates";
import { assertDefined } from "@/utils/assert";
import { company_workers_url } from "@/utils/routes";
import { latestUserComplianceInfo, simpleUser } from "../users";
import RateUpdated from "./RateUpdated";

type CompanyContractor = typeof companyContractors.$inferSelect;
type DocumentTemplate = typeof documentTemplates.$inferSelect;

export const contractorsRouter = createRouter({
  list: companyProcedure
    .input(z.object({ excludeAlumni: z.boolean().optional(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.companyAdministrator) throw new TRPCError({ code: "FORBIDDEN" });
      const where = and(
        eq(companyContractors.companyId, ctx.company.id),
        input.excludeAlumni ? isNull(companyContractors.endedAt) : undefined,
      );
      const rows = await db.query.companyContractors.findMany({
        where,
        with: {
          user: {
            with: {
              userComplianceInfos: latestUserComplianceInfo,
              wiseRecipients: { columns: { id: true }, limit: 1 },
            },
          },
          payRates: true,
        },
        orderBy: desc(companyContractors.id),
        limit: input.limit,
      });
      const workers = rows.map((worker) => ({
        ...pick(worker, ["startedAt", "hoursPerWeek", "endedAt", "role"]),
        id: worker.externalId,
        payRates: worker.payRates.map((rate) => ({
          type: rate.type,
          amount: rate.amount,
          currency: rate.currency,
        })),
        payRateType: worker.payRates[0]?.type ?? PayRateType.Hourly,
        payRateInSubunits: worker.payRates[0]?.amount ?? 0,
        user: {
          ...simpleUser(worker.user),
          ...pick(worker.user, "countryCode", "invitationAcceptedAt"),
          onboardingCompleted: worker.user.legalName && worker.user.preferredName && worker.user.countryCode,
        } as const,
      }));
      return workers;
    }),
  get: companyProcedure.input(z.object({ userId: z.string() })).query(async ({ ctx, input }) => {
    if (!ctx.companyAdministrator) throw new TRPCError({ code: "FORBIDDEN" });
    const contractor = await db.query.companyContractors.findFirst({
      where: and(
        eq(companyContractors.companyId, ctx.company.id),
        eq(companyContractors.userId, byExternalId(users, input.userId)),
      ),
      with: {
        equityAllocations: { where: eq(equityAllocations.year, new Date().getFullYear()) },
        payRates: true,
      },
    });
    if (!contractor) throw new TRPCError({ code: "NOT_FOUND" });
    return {
      ...pick(contractor, ["hoursPerWeek", "endedAt", "role"]),
      id: contractor.externalId,
      payRates: contractor.payRates.map((rate) => ({
        type: rate.type,
        amount: rate.amount,
        currency: rate.currency,
      })),
      payRateType: contractor.payRates[0]?.type ?? PayRateType.Hourly,
      payRateInSubunits: contractor.payRates[0]?.amount ?? 0,
      equityPercentage: contractor.equityAllocations[0]?.equityPercentage ?? 0,
    };
  }),
  create: companyProcedure
    .input(
      z.object({
        email: z.string(),
        startedAt: z.string(),
        payRates: z
          .array(
            z.object({
              type: z.nativeEnum(PayRateType),
              amount: z.number(),
              currency: z.string().default("usd"),
            }),
          )
          .min(1),
        hoursPerWeek: z.number().nullable(),
        role: z.string(),
        documentTemplateId: z.string(),
        contractSignedElsewhere: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.companyAdministrator) throw new TRPCError({ code: "FORBIDDEN" });

      let template: DocumentTemplate | undefined;
      if (!input.contractSignedElsewhere) {
        template = await db.query.documentTemplates.findFirst({
          where: and(
            eq(documentTemplates.externalId, input.documentTemplateId),
            or(eq(documentTemplates.companyId, ctx.company.id), isNull(documentTemplates.companyId)),
            eq(documentTemplates.type, DocumentTemplateType.ConsultingContract),
          ),
        });
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      }

      const response = await fetch(company_workers_url(ctx.company.externalId, { host: ctx.host }), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ctx.headers },
        body: JSON.stringify({
          contractor: {
            email: input.email,
            started_at: input.startedAt,
            pay_rates: input.payRates.map((rate) => ({
              amount: rate.amount,
              currency: rate.currency,
              type:
                rate.type === PayRateType.Hourly
                  ? "hourly"
                  : rate.type === PayRateType.ProjectBased
                    ? "project_based"
                    : "salary",
            })),
            role: input.role,
            contract_signed_elsewhere: input.contractSignedElsewhere,
            hours_per_week: input.hoursPerWeek,
          },
        }),
      });
      if (!response.ok) {
        const json = z.object({ error_message: z.string() }).parse(await response.json());
        throw new TRPCError({ code: "BAD_REQUEST", message: json.error_message });
      }
      const hasSalaryRate = input.payRates.some((rate) => rate.type === PayRateType.Salary);
      if (hasSalaryRate || !template) return { documentId: null };
      const { new_user_id, document_id } = z
        .object({ new_user_id: z.number(), document_id: z.number() })
        .parse(await response.json());
      const user = assertDefined(await db.query.users.findFirst({ where: eq(users.id, BigInt(new_user_id)) }));
      const submission = await createSubmission(ctx, template.docusealId, user, "Company Representative");
      const [document] = await db
        .update(documents)
        .set({ docusealSubmissionId: submission.id })
        .where(and(eq(documents.id, BigInt(document_id))))
        .returning();
      return { documentId: document?.id };
    }),
  update: companyProcedure
    .input(
      z.object({
        id: z.string(),
        payRates: z
          .array(
            z.object({
              type: z.nativeEnum(PayRateType),
              amount: z.number(),
              currency: z.string().default("usd"),
            }),
          )
          .min(1)
          .optional(),
        hoursPerWeek: z.number().nullable().optional(),
        role: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      db.transaction(async (tx) => {
        if (!ctx.companyAdministrator) throw new TRPCError({ code: "FORBIDDEN" });
        const contractor = await tx.query.companyContractors.findFirst({
          where: and(eq(companyContractors.companyId, ctx.company.id), eq(companyContractors.externalId, input.id)),
          with: { user: true, payRates: true },
        });
        if (!contractor) throw new TRPCError({ code: "NOT_FOUND" });

        await tx
          .update(companyContractors)
          .set(pick(input, ["hoursPerWeek", "role"]))
          .where(eq(companyContractors.id, contractor.id));

        if (input.payRates) {
          await tx.delete(payRates).where(eq(payRates.companyContractorId, contractor.id));

          await tx.insert(payRates).values(
            input.payRates.map((rate) => ({
              companyContractorId: contractor.id,
              amount: rate.amount,
              currency: rate.currency,
              type: rate.type,
            })),
          );
        }
        let documentId: bigint | null = null;
        const oldPayRateAmount = contractor.payRates[0]?.amount ?? 0;
        const newPayRateAmount = input.payRates?.[0]?.amount ?? oldPayRateAmount;
        if (input.payRates && newPayRateAmount !== oldPayRateAmount) {
          const payRateType = input.payRates[0]?.type ?? contractor.payRates[0]?.type ?? PayRateType.Hourly;
          if (payRateType !== PayRateType.Salary) {
            await tx.delete(documents).where(
              and(
                eq(documents.type, DocumentType.ConsultingContract),
                exists(
                  tx
                    .select({ _: sql`1` })
                    .from(documentSignatures)
                    .where(
                      and(
                        eq(documentSignatures.documentId, documents.id),
                        eq(documentSignatures.userId, contractor.userId),
                        isNull(documentSignatures.signedAt),
                      ),
                    ),
                ),
              ),
            );
            // TODO store which template was used for the previous contract
            const template = await db.query.documentTemplates.findFirst({
              where: and(
                or(eq(documentTemplates.companyId, ctx.company.id), isNull(documentTemplates.companyId)),
                eq(documentTemplates.type, DocumentTemplateType.ConsultingContract),
              ),
              orderBy: desc(documentTemplates.createdAt),
            });
            const submission = await createSubmission(
              ctx,
              assertDefined(template).docusealId,
              contractor.user,
              "Company Representative",
            );
            const [document] = await tx
              .insert(documents)
              .values({
                name: "Consulting agreement",
                year: new Date().getFullYear(),
                companyId: ctx.company.id,
                type: DocumentType.ConsultingContract,
                docusealSubmissionId: submission.id,
              })
              .returning();
            documentId = assertDefined(document).id;

            await tx.insert(documentSignatures).values([
              {
                documentId,
                userId: ctx.companyAdministrator.userId,
                title: "Company Representative",
              },
              {
                documentId,
                userId: contractor.userId,
                title: "Signer",
              },
            ]);
          }
          if (payRateType === PayRateType.Hourly) {
            await sendEmail({
              from: `Flexile <support@${env.DOMAIN}>`,
              to: contractor.user.email,
              replyTo: ctx.company.email,
              subject: `Your rate has changed!`,
              react: RateUpdated({
                host: ctx.host,
                oldRate: oldPayRateAmount,
                newRate: newPayRateAmount,
                documentId,
              }),
            });
          }
        }
        return { documentId };
      }),
    ),
  cancelContractEnd: companyProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    if (!ctx.companyAdministrator) throw new TRPCError({ code: "FORBIDDEN" });

    const contractor = await db.query.companyContractors.findFirst({
      with: { user: true },
      where: and(
        eq(companyContractors.externalId, input.id),
        eq(companyContractors.companyId, ctx.company.id),
        isNotNull(companyContractors.endedAt),
      ),
    });

    if (!contractor) throw new TRPCError({ code: "NOT_FOUND" });

    await db.update(companyContractors).set({ endedAt: null }).where(eq(companyContractors.id, contractor.id));
  }),

  endContract: companyProcedure
    .input(
      z.object({
        id: z.string(),
        endDate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.companyAdministrator) throw new TRPCError({ code: "FORBIDDEN" });

      const activeContractor = await db.query.companyContractors.findFirst({
        with: {
          user: true,
        },
        where: and(
          eq(companyContractors.externalId, input.id),
          eq(companyContractors.companyId, ctx.company.id),
          isNull(companyContractors.endedAt),
        ),
      });

      if (!activeContractor) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(companyContractors)
        .set({ endedAt: new Date(input.endDate) })
        .where(eq(companyContractors.id, activeContractor.id));
    }),
});

export const isActive = (contractor: CompanyContractor | undefined): contractor is CompanyContractor =>
  !!contractor && (!contractor.endedAt || isFuture(contractor.endedAt));
