import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  title,
  description,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-lg",
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-muted text-foreground hover:bg-muted/80",
    destructive: "bg-destructive text-white hover:opacity-90",
    ghost: "hover:bg-muted text-foreground",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <input
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  className,
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <select
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-accent/20 text-accent",
    warning: "bg-yellow-500/20 text-yellow-400",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No data yet
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border p-4",
        highlight && "border-primary/50 bg-primary/5"
      )}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
