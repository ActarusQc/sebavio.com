"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Label, Switch, Textarea } from "@/components/ui";
import { updatePlanMetadataAction } from "@/features/plans/actions";
import { PlanFormSection } from "@/features/plans/components/plan-form-section";

type Props = {
  planId: string;
  initial: {
    publicName: string;
    shortDescription: string | null;
    fullDescription: string | null;
    displayOrder: number;
    isFeatured: boolean;
    isVisibleOnSignup: boolean;
    defaultTrialDays: number | null;
  };
};

export function EditPlanForm({ planId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [publicName, setPublicName] = useState(initial.publicName);
  const [shortDescription, setShortDescription] = useState(
    initial.shortDescription ?? "",
  );
  const [fullDescription, setFullDescription] = useState(
    initial.fullDescription ?? "",
  );
  const [displayOrder, setDisplayOrder] = useState(
    String(initial.displayOrder),
  );
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [isVisibleOnSignup, setIsVisibleOnSignup] = useState(
    initial.isVisibleOnSignup,
  );
  const [defaultTrialDays, setDefaultTrialDays] = useState(
    initial.defaultTrialDays == null ? "" : String(initial.defaultTrialDays),
  );
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updatePlanMetadataAction({
        planId,
        publicName,
        shortDescription: shortDescription || undefined,
        fullDescription: fullDescription || undefined,
        displayOrder: Number.parseInt(displayOrder, 10) || 0,
        isFeatured,
        isVisibleOnSignup,
        defaultTrialDays:
          defaultTrialDays.trim() === ""
            ? null
            : Number.parseInt(defaultTrialDays, 10),
      });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Métadonnées enregistrées.");
      router.push(`/admin/plans/${planId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <PlanFormSection title="Métadonnées commerciales">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="publicName">Nom public</Label>
            <Input
              id="publicName"
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="shortDescription">Description courte</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="fullDescription">Description complète</Label>
            <Textarea
              id="fullDescription"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayOrder">Ordre</Label>
            <Input
              id="displayOrder"
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultTrialDays">Essai (jours)</Label>
            <Input
              id="defaultTrialDays"
              type="number"
              min={0}
              value={defaultTrialDays}
              onChange={(e) => setDefaultTrialDays(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <Label>Populaire</Label>
            <Switch
              checked={isFeatured}
              onCheckedChange={(v) => setIsFeatured(v)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <Label>Visible à l’inscription</Label>
            <Switch
              checked={isVisibleOnSignup}
              onCheckedChange={(v) => setIsVisibleOnSignup(v)}
            />
          </div>
        </div>
      </PlanFormSection>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/plans/${planId}`)}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
