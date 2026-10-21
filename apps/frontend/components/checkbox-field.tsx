import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { LabeledCheckbox } from "@support-hub/ui";

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  disabled
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <LabeledCheckbox
          id={name}
          label={label}
          checked={field.value}
          disabled={disabled}
          onCheckedChange={field.onChange}
        />
      )}
    />
  );
}
