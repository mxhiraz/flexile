import { utc } from "@date-fns/utc";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { parseISO, startOfWeek } from "date-fns";
import { List, Map } from "immutable";
import { useEffect, useId, useState } from "react";
import { DatePicker } from "@/components/DatePicker";
import MutationButton from "@/components/MutationButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCurrentCompany, useCurrentUser } from "@/global";
import { areOverlapping } from "@/models/period";
import { trpc } from "@/trpc/client";
import { assertDefined } from "@/utils/assert";
import { formatServerDate } from "@/utils/time";

type CompanyWorkerAbsenceForm = {
  id: bigint | null;
  startsOn: Date | null;
  endsOn: Date | null;
};
const AbsencesModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const company = useCurrentCompany();
  const user = useCurrentUser();
  const uid = useId();

  const currentPeriodStartsOn = formatServerDate(startOfWeek(new Date(), { in: utc }));
  const [workerAbsences] = trpc.workerAbsences.list.useSuspenseQuery({
    companyId: company.id,
    contractorId: user.roles.worker?.id,
    from: currentPeriodStartsOn,
  });

  const absencesData = workerAbsences.map((absence) => ({
    id: absence.id,
    startsOn: parseISO(absence.startsOn),
    endsOn: parseISO(absence.endsOn),
  }));
  const [absences, setAbsences] = useState<List<CompanyWorkerAbsenceForm>>(
    List([...absencesData, { id: null, startsOn: null, endsOn: null }]),
  );
  useEffect(() => {
    setAbsences(List([...absencesData, { id: null, startsOn: null, endsOn: null }]));
  }, [workerAbsences]);
  const [toBeDeletedAbsenceIds, setToBeDeletedAbsenceIds] = useState<List<bigint>>(List());
  const [absenceErrors, setAbsenceErrors] = useState(Map<CompanyWorkerAbsenceForm, string>());
  const updateAbsence = (index: number, update: Partial<CompanyWorkerAbsenceForm>) =>
    setAbsences((absences) => absences.update(index, (absence) => ({ ...assertDefined(absence), ...update })));

  const createAbsenceMutation = trpc.workerAbsences.create.useMutation();
  const updateAbsenceMutation = trpc.workerAbsences.update.useMutation();
  const deleteAbsenceMutation = trpc.workerAbsences.delete.useMutation();

  const validateAbsences = () => {
    const newErrors = absenceErrors.clear().withMutations((errors) => {
      const validAbsences = absences.filter((absence) => {
        if (absence.startsOn === null && absence.endsOn === null) return false;
        if (absence.startsOn === null || absence.endsOn === null) {
          errors.set(absence, "Please provide both start and end dates for absences");
          return false;
        }
        if (new Date(absence.startsOn) > new Date(absence.endsOn)) {
          errors.set(absence, "End date must be on or after start date");
          return false;
        }
        return true;
      });

      validAbsences.forEach((absence, index) => {
        validAbsences.forEach((otherAbsence, otherIndex) => {
          if (index <= otherIndex) return;
          if (
            areOverlapping(
              { startsOn: absence.startsOn, endsOn: absence.endsOn },
              { startsOn: otherAbsence.startsOn, endsOn: otherAbsence.endsOn },
            )
          ) {
            errors.set(absence, "Absence periods cannot overlap");
            errors.set(otherAbsence, "Absence periods cannot overlap");
          }
        });
      });
    });
    setAbsenceErrors(newErrors);
    return newErrors.size === 0;
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!validateAbsences()) throw new Error("Invalid absences");

      const validAbsences = absences
        .filter((absence) => absence.startsOn !== null && absence.endsOn !== null)
        .map((absence) => ({
          ...absence,
          startsOn: assertDefined(absence.startsOn),
          endsOn: assertDefined(absence.endsOn),
        }));
      await Promise.all([
        ...validAbsences.map((absence) => {
          const data = {
            companyId: company.id,
            startsOn: formatServerDate(absence.startsOn),
            endsOn: formatServerDate(absence.endsOn),
          };
          if (absence.id === null) return createAbsenceMutation.mutateAsync(data);
          return updateAbsenceMutation.mutateAsync({ ...data, id: absence.id });
        }),
        ...toBeDeletedAbsenceIds.map((id) => deleteAbsenceMutation.mutateAsync({ companyId: company.id, id })),
      ]);
    },
    onSuccess: () => {
      setToBeDeletedAbsenceIds(List());
      setTimeout(() => {
        submit.reset();
        onClose();
      }, 1000);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="lg:min-w-[65ch]">
        <DialogHeader>
          <DialogTitle>Time off</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {absences.size === 0 ? "no time off" : null}
          {absences.map((absence, index) => (
            <div key={absence.id || `absence-${index}`} className="flex flex-col gap-2 lg:flex-row">
              <div className="grid flex-1 gap-2">
                <Label htmlFor={`startsOn-${index}`}>From</Label>
                <DatePicker
                  id={`${uid}-startsOn-${index}`}
                  value={absence.startsOn}
                  onChange={(date) => updateAbsence(index, { startsOn: date })}
                  invalid={absenceErrors.has(absence)}
                />
              </div>
              <div className="grid flex-1 gap-2">
                <Label htmlFor={`endsOn-${index}`}>Until</Label>
                <DatePicker
                  id={`${uid}-endsOn-${index}`}
                  value={absence.endsOn}
                  onChange={(date) => updateAbsence(index, { endsOn: date })}
                  invalid={absenceErrors.has(absence)}
                />
                {absenceErrors.has(absence) && absenceErrors.get(absence) ? (
                  <p className="text-destructive text-sm">{absenceErrors.get(absence)}</p>
                ) : null}
              </div>
              <div className="flex items-end">
                <Button
                  variant="link"
                  aria-label="Remove"
                  className="flex justify-center lg:p-3 lg:pr-1"
                  disabled={absences.size === 1 && absence.id === null}
                  onClick={() => {
                    const absenceId = absence.id;
                    if (absenceId !== null) {
                      setToBeDeletedAbsenceIds((toBeDeletedAbsenceIds) => toBeDeletedAbsenceIds.push(absenceId));
                    }
                    setAbsences((absences) => {
                      let newAbsences = absences.delete(index);
                      if (newAbsences.size === 0) {
                        newAbsences = newAbsences.push({ id: null, startsOn: null, endsOn: null });
                      }
                      return newAbsences;
                    });
                  }}
                >
                  <TrashIcon className="size-4" />
                  <span className="lg:hidden"> Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <Button
            variant="link"
            className="flex items-center gap-2"
            onClick={() => setAbsences((absences) => absences.push({ id: null, startsOn: null, endsOn: null }))}
          >
            <PlusIcon className="size-4" />
            <span>Add more</span>
          </Button>
        </div>

        <DialogFooter>
          <MutationButton mutation={submit} loadingText="Saving..." successText="Saved!" idleVariant="primary">
            Save time off
          </MutationButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AbsencesModal;
