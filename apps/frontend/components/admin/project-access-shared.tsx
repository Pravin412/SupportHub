import { z } from "zod";

export const agentSchema = z.object({
  name: z.string().min(2, "Agent name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  password: z.string().optional(),
  role: z.enum(["PROJECT_ADMIN", "PROJECT_AGENT"]),
  mobileNumber: z.string().trim().refine((value) => !value || /^[1-9]\d{8,14}$/.test(value.replace(/[\s()+-]/g, "")), "Enter a valid mobile number including country code."),
  whatsappNotificationsEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean()
});

export type AgentRole = "PROJECT_ADMIN" | "PROJECT_AGENT";
export type AgentEdit = { name: string; email: string; role: AgentRole; emailNotificationsEnabled: boolean; mobileNumber: string; whatsappNotificationsEnabled: boolean };

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-error-muted">{message}</p>;
}
