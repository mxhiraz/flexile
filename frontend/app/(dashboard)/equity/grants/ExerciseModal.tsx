import { useMutation } from "@tanstack/react-query";
import { Decimal } from "decimal.js";
import { Fragment, useId, useState } from "react";
import Delta from "@/components/Delta";
import MutationButton from "@/components/MutationButton";
import RangeInput from "@/components/RangeInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCurrentCompany } from "@/global";
import type { RouterOutput } from "@/trpc";
import { trpc } from "@/trpc/client";
import { assertDefined } from "@/utils/assert";
import { formatMoney } from "@/utils/formatMoney";
import { request } from "@/utils/request";
import { company_equity_grant_exercises_path } from "@/utils/routes";

type EquityGrant = RouterOutput["equityGrants"]["list"][number];

const ExerciseModal = ({
  equityGrants,
  companySharePrice,
  companyValuation,
  onClose,
}: {
  equityGrants: EquityGrant[];
  companySharePrice: string;
  companyValuation: number;
  onClose: () => void;
}) => {
  const company = useCurrentCompany();
  const uid = useId();
  const [optionsToExercise, setOptionsToExercise] = useState(0);
  const [selectedGrantIds, setSelectedGrantIds] = useState<string[]>(() =>
    equityGrants.length === 1 && equityGrants[0]?.id ? [equityGrants[0].id] : [],
  );
  const [signing, setSigning] = useState(false);
  let remaining = optionsToExercise;
  const selectedGrants = new Map(
    selectedGrantIds.map((id) => {
      const grant = assertDefined(equityGrants.find((g) => g.id === id));
      const toExercise = Math.min(remaining, grant.vestedShares);
      remaining -= toExercise;
      return [grant, toExercise];
    }),
  );
  const sortedGrants = [...equityGrants].sort((a, b) => {
    if (a.exercisePriceUsd !== b.exercisePriceUsd) {
      return new Decimal(a.exercisePriceUsd).sub(b.exercisePriceUsd).toNumber();
    }
    return a.issuedAt.getTime() - b.issuedAt.getTime();
  });

  const maxExercisableOptions = [...selectedGrants].reduce((total, [grant]) => total + grant.vestedShares, 0);

  const totalExerciseCost = [...selectedGrants].reduce(
    (total, [grant, options]) => total.add(new Decimal(options).mul(grant.exercisePriceUsd)),
    new Decimal(0),
  );

  const equityValueDelta = totalExerciseCost.eq(0)
    ? 0
    : new Decimal(optionsToExercise).mul(companySharePrice).sub(totalExerciseCost).div(totalExerciseCost).toNumber();

  const trpcUtils = trpc.useUtils();
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (optionsToExercise === 0) throw new Error("No options to exercise");
      const equityGrants = [...selectedGrants].map(([grant, options]) => ({
        id: grant.id,
        number_of_options: options,
      }));

      await request({
        method: "POST",
        url: company_equity_grant_exercises_path(company.id),
        accept: "json",
        jsonData: { equity_grants: equityGrants },
        assertOk: true,
      });
      await trpcUtils.equityGrants.list.refetch();
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="ml-auto max-w-prose md:mr-0">
        <DialogHeader>
          <DialogTitle>Exercise your options</DialogTitle>
        </DialogHeader>
        {signing ? (
          <>
            <div className="prose max-h-100 overflow-auto rounded-md border p-2">
              <h2 className="mx-auto mb-2 text-center text-lg font-bold">NOTICE OF EXERCISE</h2>
              <p>
                This constitutes notice to {company.name} (the “<strong>Company</strong>”) under my stock option that I
                elect to purchase the below number of shares of Common Stock of the Company (the “
                <strong>Shares</strong>”) for the price set forth below. Use of certain payment methods is subject to
                Company and/or Board consent and certain additional requirements set forth in the Option Agreement and
                the Plan.{" "}
              </p>
              <p>
                By this exercise, I agree (i) to provide such additional documents as you may require pursuant to the
                terms of the Equity Incentive Plan, (ii) to provide for the payment by me to you (in the manner
                designated by you) of your withholding obligation, if any, relating to the exercise of this option,
                (iii) if this exercise relates to an incentive stock option, to notify you in writing within 15 days
                after the date of any disposition of any of the Shares issued upon exercise of this option that occurs
                within two years after the date of grant of this option or within one year after such Shares are issued
                upon exercise of this option, and (iv) to execute, if and when requested by the Company, at any time or
                from time to time, any agreements entered into with holders of capital stock of the Company, including
                without limitation a right of first refusal and co-sale agreement, stockholders agreement and/or a
                voting agreement. I further agree that this Notice of Exercise may be delivered via facsimile,
                electronic mail (including pdf or any electronic signature complying with the U.S. federal ESIGN Act of
                2000, Uniform Electronic Transactions Act or other applicable law) or other transmission method and will
                be deemed to have been duly and validly delivered and be valid and effective for all purposes.
              </p>
              <p>
                I hereby make the following certifications and representations with respect to the number of Shares
                listed above, which are being acquired by me for my own account upon exercise of the option as set forth
                above:
              </p>
              <p>
                I acknowledge that the Shares have not been registered under the Securities Act of 1933, as amended (the
                “<strong>Securities Act</strong>”), and are deemed to constitute “restricted securities” under Rule 701
                and Rule 144 promulgated under 1 If left blank, will be issued in the name of the option holder. 2 Cash
                may be in the form of cash, check, bank draft, electronic funds transfer or money order payment. 3
                Subject to Company and/or Board consent and must meet the public trading and other requirements set
                forth in the Option Agreement. 4 Subject to Company and/or Board consent and must meet the public
                trading and other requirements set forth in the Option Agreement. Shares must be valued in accordance
                with the terms of the option being exercised, and must be owned free and clear of any liens, claims,
                encumbrances or security interests. Certificates must be endorsed or accompanied by an executed
                assignment separate from certificate. 5 Subject to Company and/or Board consent and must be a
                Nonstatutory Option. 256742988 v1 the Securities Act. I warrant and represent to the Company that I have
                no present intention of distributing or selling said Shares, except as permitted under the Securities
                Act and any applicable state securities laws.
              </p>
              <p>
                I further acknowledge and agree that, except for such information as required to be delivered to me by
                the Company pursuant to the option or the Plan (if any), I will have no right to receive any information
                from the Company by virtue of the grant of the option or the purchase of shares of Common Stock through
                exercise of the option, ownership of such shares of Common Stock, or as a result of my being a holder of
                record of stock of the Company. Without limiting the foregoing, to the fullest extent permitted by law,
                I hereby waive all inspection rights under Section 220 of the Delaware General Corporation Law and all
                such similar information and/or inspection rights that may be provided under the law of any
                jurisdiction, or any federal, state or foreign regulation, that are, or may become, applicable to the
                Company or the Company’s capital stock (the “Inspection Rights”). I hereby covenant and agree never to
                directly or indirectly commence, voluntarily aid in any way, prosecute, assign, transfer, or cause to be
                commenced any claim, action, cause of action, or other proceeding to pursue or exercise the Inspection
                Rights.
              </p>
              <p>
                I further acknowledge that I will not be able to resell the Shares for at least 90 days after the stock
                of the Company becomes publicly traded (i.e., subject to the reporting requirements of Section 13 or
                15(d) of the Securities Exchange Act of 1934) under Rule 701 and that more restrictive conditions apply
                to affiliates of the Company under Rule 144.{" "}
              </p>
              <p>
                I further acknowledge that all certificates representing any of the Shares subject to the provisions of
                the option will have endorsed thereon appropriate legends reflecting the foregoing limitations, as well
                as any legends reflecting restrictions pursuant to the Company’s Certificate of Incorporation, Bylaws
                and/or applicable securities laws.{" "}
              </p>
              <p>
                I further agree that, if required by the Company (or a representative of the underwriters) in connection
                with the first underwritten registration of the offering of any securities of the Company under the
                Securities Act, I will not sell, dispose of, transfer, make any short sale of, grant any option for the
                purchase of, or enter into any hedging or similar transaction with the same economic effect as a sale
                with respect to any shares of Common Stock or other securities of the Company for a period of 180 days
                following the effective date of a registration statement of the Company filed under the Securities Act
                (or such longer period as the underwriters or the Company will request to facilitate compliance with
                applicable FINRA rules) (the “Lock-Up Period”). I further agree to execute and deliver such other
                agreements as may be reasonably requested by the Company or the underwriters that are consistent with
                the foregoing or that are necessary to give further effect thereto. In order to enforce the foregoing
                covenant, the Company may impose stop-transfer instructions with respect to securities subject to the
                foregoing restrictions until the end of such period. I further agree that the obligations contained in
                this paragraph shall also, if so determined by the Company’s Board of Directors, apply in the Company’s
                initial listing of its Common Stock on a national securities exchange by means of a registration
                statement on Form S-1 under the Securities Act (or any successor registration form under the Securities
                Act subsequently adopted by the Securities and Exchange Commission) filed by the Company with the
                Securities and Exchange Commission that registers shares of existing capital stock of the Company for
                resale (a “Direct Listing”), provided that all holders of at least 5% of the Company’s outstanding
                Common Stock (after giving effect to the conversion into Common Stock of any outstanding Preferred Stock
                of the Company) are subject to substantially similar obligations with respect to such Direct Listing.
              </p>
            </div>
            <DialogFooter>
              <MutationButton mutation={submitMutation}>Sign and submit</MutationButton>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor={`${uid}-options-to-exercise`}>Options to exercise</Label>
              <RangeInput
                id={`${uid}-options-to-exercise`}
                value={optionsToExercise}
                onChange={setOptionsToExercise}
                aria-invalid={submitMutation.isError}
                min={selectedGrantIds.length > 0 ? 1 : 0}
                max={maxExercisableOptions}
              />
            </div>

            <Card className="mt-4">
              <CardContent>
                {sortedGrants.map((grant, index) => (
                  <Fragment key={grant.id}>
                    <div className="flex flex-col">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        {sortedGrants.length > 1 ? (
                          <Checkbox
                            checked={selectedGrants.has(grant)}
                            label={`${grant.periodStartedAt.getFullYear()} Grant at ${formatMoney(
                              grant.exercisePriceUsd,
                            )} / share`}
                            disabled={selectedGrantIds.length === 1 && selectedGrants.has(grant)}
                            onCheckedChange={() => {
                              setSelectedGrantIds(
                                selectedGrants.has(grant)
                                  ? selectedGrantIds.filter((id) => id !== grant.id)
                                  : [...selectedGrantIds, grant.id],
                              );
                            }}
                          />
                        ) : (
                          <span>
                            {grant.periodStartedAt.getFullYear()} Grant at {formatMoney(grant.exercisePriceUsd)} / share
                          </span>
                        )}
                        <span className="min-w-[17ch] text-right tabular-nums">
                          <span className={selectedGrants.get(grant) ? "font-bold" : ""}>
                            {(selectedGrants.get(grant) ?? 0).toLocaleString()}
                          </span>{" "}
                          of {grant.vestedShares.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1 rounded-full bg-black"
                          style={{
                            width: `${((selectedGrants.get(grant) ?? 0) / grant.vestedShares) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    {index !== sortedGrants.length - 1 && <Separator />}
                  </Fragment>
                ))}
              </CardContent>
            </Card>

            <div className="mt-4 grid">
              <h3 className="mb-2">Summary</h3>
              <Card>
                <CardContent>
                  <div className="flex justify-between gap-2 font-bold">
                    <div>Exercise cost</div>
                    <div>{formatMoney(totalExerciseCost)}</div>
                  </div>
                  <Separator />
                  <div className="flex justify-between gap-2">
                    <div>Payment method</div>
                    <div>Bank transfer</div>
                  </div>
                  <Separator />
                  <div className="flex justify-between gap-2">
                    <div>
                      Options value
                      <br />
                      <span className="text-sm text-gray-600">
                        Based on {companyValuation.toLocaleString([], { notation: "compact" })} valuation
                      </span>
                    </div>
                    <div className="text-right">
                      {formatMoney(new Decimal(optionsToExercise).mul(companySharePrice))}
                      <br />
                      <span className="flex justify-end text-sm">
                        <Delta diff={equityValueDelta} />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button onClick={() => setSigning(true)} disabled={optionsToExercise === 0}>
                Proceed
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseModal;
