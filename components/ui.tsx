import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: "sb-primary rounded-md font-medium",
  secondary: "sb-secondary rounded-md font-medium",
  ghost: "rounded-md text-ink-soft hover:bg-panel hover:text-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-[12px]",
  md: "h-9 gap-2 px-3.5 text-[13px]",
};

export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className = "",
) {
  return `inline-flex shrink-0 items-center justify-center transition-all ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`sb-panel ${className}`}>{children}</section>;
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`sb-label ${className}`}>{children}</p>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary";
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] leading-4 ${
        tone === "primary"
          ? "border-primary/30 bg-primary-soft text-primary"
          : "border-line bg-panel text-ink-faint"
      }`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <Label className="text-primary">{eyebrow}</Label> : null}
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[28px]">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-soft sm:text-sm">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="sb-panel flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-md border border-primary/25 bg-primary-soft text-primary">
        {icon}
      </span>
      <h3 className="mt-4 text-[15px] font-medium text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-soft">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="sb-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="flex size-7 items-center justify-center rounded border border-primary/20 bg-primary-soft text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-4 font-mono text-[26px] font-semibold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 truncate text-[12px] text-ink-faint">{hint}</p>
    </div>
  );
}
