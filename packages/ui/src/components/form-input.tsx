"use client";

import * as React from "react";
import { Field } from "./field";
import { Input } from "./input";
import { Textarea } from "./textarea";

export interface FormInputProps extends React.ComponentPropsWithoutRef<typeof Input> {
  /** Visible label text. */
  label: React.ReactNode;
  /** Helper text under the control. */
  description?: React.ReactNode;
  /** Validation message under the control. */
  error?: React.ReactNode;
  /** Id for the control. Generated automatically when omitted. */
  id?: string;
  /** Classes for the Field wrapper. */
  fieldClassName?: string;
  /** Classes for the label element. */
  labelClassName?: string;
}

/**
 * Input with its label, helper text and error message.
 *
 * <FormInput label="Project Name" error={errors.name?.message} {...register("name")} />
 */
const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, description, error, id, fieldClassName, labelClassName, ...inputProps }, ref) => (
    <Field label={label} description={description} error={error} id={id} className={fieldClassName} labelClassName={labelClassName}>
      {(fieldId) => <Input ref={ref} id={fieldId} {...inputProps} />}
    </Field>
  )
);
FormInput.displayName = "FormInput";

export interface FormTextareaProps extends React.ComponentPropsWithoutRef<typeof Textarea> {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
  fieldClassName?: string;
  labelClassName?: string;
}

/**
 * Textarea with its label, helper text and error message.
 */
const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, description, error, id, fieldClassName, labelClassName, ...textareaProps }, ref) => (
    <Field label={label} description={description} error={error} id={id} className={fieldClassName} labelClassName={labelClassName}>
      {(fieldId) => <Textarea ref={ref} id={fieldId} {...textareaProps} />}
    </Field>
  )
);
FormTextarea.displayName = "FormTextarea";

export { FormInput, FormTextarea };
