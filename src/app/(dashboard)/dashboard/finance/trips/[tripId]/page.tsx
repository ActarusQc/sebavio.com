import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import {
  BudgetForm,
  ExpenseForm,
  ExpensesList,
  TripFinancePanels,
} from "@/features/finance/components";
import {
  getTripFinanceSummary,
  listExpenses,
} from "@/features/finance/services";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ tripId: string }> };

export default async function TripFinancePage({ params }: PageProps) {
  const user = await requireActiveUser();
  const { tripId } = await params;

  let summary;
  let expenses;
  try {
    [summary, expenses] = await Promise.all([
      getTripFinanceSummary(user.id, tripId),
      listExpenses(user.id, { tripId, pageSize: "100" }),
    ]);
  } catch (error) {
    if (isAppError(error) && error.code === "TRIP_001") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title={summary.tripTitle}
        description="Budget et dépenses du voyage."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href="/dashboard/finance" />}
            >
              Finances
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/dashboard/trips/${tripId}`} />}
            >
              Fiche voyage
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Synthèse</CardTitle>
          <CardDescription>
            Les totaux excluent les références non importées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TripFinancePanels summary={summary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget prévu</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm
            tripId={tripId}
            plannedAmount={summary.plannedAmount}
            currency={summary.currency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm tripId={tripId} defaultCurrency={summary.currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dépenses</CardTitle>
          <CardDescription>
            {expenses.total} dépense{expenses.total > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpensesList expenses={expenses.items} tripId={tripId} />
        </CardContent>
      </Card>
    </div>
  );
}
