import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-field-600 text-white hover:bg-field-700",
        variant === "secondary" && "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition",
        variant === "primary" && "bg-field-600 text-white hover:bg-field-700",
        variant === "secondary" && "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
        className
      )}
      {...props}
    />
  );
}

export function BackLink({
  href,
  children = "Voltar",
  className,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string; children?: ReactNode }) {
  return (
    <LinkButton href={href} variant="secondary" className={cn("gap-2", className)} {...props}>
      <ArrowLeft size={16} />
      {children}
    </LinkButton>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg border border-zinc-200 bg-white p-5 shadow-soft", className)} {...props} />;
}

export function CardTitle({
  icon: Icon,
  children,
  className
}: {
  icon: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("flex items-center gap-2 font-semibold text-zinc-900", className)}>
      <Icon size={18} className="text-field-700" />
      <span>{children}</span>
    </h2>
  );
}

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
      <h2 className="font-semibold text-zinc-900">{title}</h2>
      {description ? <p className="mt-2 text-sm text-zinc-600">{description}</p> : null}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function Stat({ label, value, description }: { label: string; value: ReactNode; description?: ReactNode }) {
  return (
    <Card>
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {description ? <p className="mt-1 text-xs text-zinc-500">{description}</p> : null}
    </Card>
  );
}
