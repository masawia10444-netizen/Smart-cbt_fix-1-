import { PASSWORD_MIN_LENGTH } from "@/constants/configuration";
import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().min(1).email(),
    password: z.string().optional().default(""),
    confirmPassword: z.string().trim().optional().default(""),
    phoneNumber: z.string().trim().optional().default(""),
    firstName: z.string().trim().optional().default(""),
    lastName: z.string().trim().optional().default(""),
    citizenId: z.string().trim().optional().default(""),
    dateOfBirthString: z.string().trim().optional().default(""),
    notification: z.preprocess((value) => value === "true" || value === true, z.boolean()).optional().default(false),
    isMToken: z.preprocess((value) => value === "true" || value === true, z.boolean()).optional().default(false),
  })
  .superRefine((form, ctx) => {
    if (!form.password || form.password.length < PASSWORD_MIN_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: PASSWORD_MIN_LENGTH,
        type: "string",
        inclusive: true,
        path: ["password"],
      });
    }

    if (!form.confirmPassword || form.confirmPassword.length < PASSWORD_MIN_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: PASSWORD_MIN_LENGTH,
        type: "string",
        inclusive: true,
        path: ["confirmPassword"],
      });
    }

    if ((form.password || "") !== (form.confirmPassword || "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        params: { i18n: "password_not_match" },
      });
    }
  });

export type RegisterSchema = z.infer<typeof registerSchema>;
