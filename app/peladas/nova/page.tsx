import { createPeladaAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function NewPeladaPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Nova pelada" description="Configure os dados operacionais básicos. Você será o owner." />
      <Card>
        <ActionStateForm action={createPeladaAction} submitLabel="Criar pelada">
          <PeladaFields />
        </ActionStateForm>
      </Card>
    </div>
  );
}

function PeladaFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Field label="Nome"><input name="name" required /></Field></div>
      <div className="sm:col-span-2"><Field label="Descrição"><textarea name="description" rows={3} /></Field></div>
      <Field label="Cidade"><input name="city" /></Field>
      <Field label="Bairro"><input name="neighborhood" /></Field>
      <div className="sm:col-span-2"><Field label="Local"><input name="venue" /></Field></div>
      <Field label="Dias preferenciais"><input name="preferred_weekdays" placeholder="Ex.: terças e quintas" /></Field>
      <Field label="Horário padrão"><input name="default_time" type="time" /></Field>
      <Field label="Valor mensalista"><input name="monthly_fee" type="number" step="0.01" min="0" /></Field>
      <Field label="Valor diarista"><input name="daily_fee" type="number" step="0.01" min="0" /></Field>
      <input type="hidden" name="status" value="active" />
    </div>
  );
}
