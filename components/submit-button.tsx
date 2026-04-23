"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

export function SubmitButton({ children = "Salvar" }: { children?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : children}
    </Button>
  );
}
