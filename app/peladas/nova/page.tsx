import { createPeladaAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { PeladaFormFields } from "@/components/pelada-form-fields";
import { BackLink, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function NewPeladaPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <BackLink href="/dashboard">Voltar ao painel</BackLink>
      </div>
      <PageHeader title="Nova pelada" description="Configure os dados operacionais básicos. Você sera o owner." theme="dark" />
      <Card>
        <ActionStateForm action={createPeladaAction} submitLabel="Criar pelada">
          <PeladaFormFields />
        </ActionStateForm>
      </Card>
    </div>
  );
}
