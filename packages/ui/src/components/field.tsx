"use client";

import * as React from "react";
import { Label } from "./label";
import { cn } from "../lib/utils";

export interface FieldProps {
  /** Visible label text (or any node). */
  label: React.ReactNode;
  /** Helper text shown under the control. */
  description?: React.ReactNode;
  /** Validation message shown under the control. */
  error?: React.ReactNode;
  /** Id linking the label to the control. Generated automatically when omitted. */
  id?: string;
  /** Classes for the outer wrapper. */
  className?: string;
  /** Classes for the label element. */
  labelClassName?: string;
  /** The control: either a node, or a render function that receives the id to put on the control. */
  children: React.ReactNode | ((id: string) => React.ReactNode);
}

/**
 * Label + control + helper/error text, wired together with htmlFor/id.
 *
 * <Field label="Name" error={errors.name?.message}>
 *   {(id) => <Input id={id} {...register("name")} />}
 * </Field>
 */
function Field({ label, description, error, id, className, labelClassName, children }: FieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label htmlFor={fieldId} className={cn("font-medium text-slate-800", labelClassName)}>
        {label}
      </Label>
      {typeof children === "function" ? children(fieldId) : children}
      {description && <p className="text-xs text-muted">{description}</p>}
      {error && <p className="text-xs font-medium text-error-muted">{error}</p>}
    </div>
  );
}
Field.displayName = "Field";

export { Field };
