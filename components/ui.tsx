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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-field-500 text-white shadow-sm hover:bg-field-600",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-brand-700/25 hover:bg-slate-50",
        variant === "danger" && "bg-red-600 text-white shadow-sm hover:bg-red-700",
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        variant === "primary" && "bg-field-500 text-white shadow-sm hover:bg-field-600",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-brand-700/25 hover:bg-slate-50",
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
  return <div className={cn("surface-panel p-5", className)} {...props} />;
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
    <h2 className={cn("flex items-center gap-2.5 font-semibold text-slate-900", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-field-50 text-field-700">
        <Icon size={18} className="text-field-700" />
      </span>
      <span>{children}</span>
    </h2>
  );
}

export function PageHeader({
  title,
  description,
  action,
  theme = "light"
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  theme?: "light" | "dark";
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={cn("text-3xl font-extrabold tracking-tight sm:text-4xl", theme === "dark" ? "text-white" : "text-brand-950")}>{title}</h1>
        {description ? (
          <p className={cn("mt-2 max-w-2xl text-sm leading-6 sm:text-base", theme === "dark" ? "text-slate-200" : "text-slate-600")}>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
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
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-field-100/60 blur-2xl" />
      <p className="relative text-sm font-medium text-slate-600">{label}</p>
      <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-brand-950">{value}</p>
      {description ? <p className="relative mt-1 text-xs text-slate-500">{description}</p> : null}
    </Card>
  );
}
