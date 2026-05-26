"use client";

import { register } from "@/app/[locale]/(index)/(unauthenticated)/register/action";
import { customZodResolver } from "@/schemas/base-schema";
import { RegisterSchema, registerSchema } from "@/schemas/forms/register-schema";
import { validatePhone } from "@/utils/cms/api-helpers";
import { handleAPIError, toastSuccess } from "@/utils/helper";
import { MTokenProfile } from "@/utils/mtoken";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../Button";
import { NextLink } from "../Link";
import FloatingLabelTextInput from "../form/FormFloatingLabelTextInput";

type RegisterFormProps = {
  initialMTokenProfile?: MTokenProfile | null;
};

const RegisterForm = ({ initialMTokenProfile = null }: RegisterFormProps) => {
  const t = useTranslations("common");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const isMToken = useMemo(() => Boolean(initialMTokenProfile), [initialMTokenProfile]);
  const lockEmail = Boolean(initialMTokenProfile?.email);
  const lockMobile = Boolean(initialMTokenProfile?.mobile);
  const lockFirstName = Boolean(initialMTokenProfile?.firstName);
  const lockLastName = Boolean(initialMTokenProfile?.lastName);

  const {
    handleSubmit,
    control,
    register: registerField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: customZodResolver(registerSchema),
    defaultValues: {
      email: initialMTokenProfile?.email || "",
      password: "",
      confirmPassword: "",
      phoneNumber: initialMTokenProfile?.mobile || "",
      firstName: initialMTokenProfile?.firstName || "",
      lastName: initialMTokenProfile?.lastName || "",
      citizenId: "",
      dateOfBirthString: "",
      notification: Boolean(initialMTokenProfile?.notification),
      isMToken,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    const registerResult = await register(data);
    if (registerResult?.error) {
      handleAPIError(registerResult.error);
      setIsLoading(false);
    } else {
      if (registerResult?.redirectTo === "/main-menus") {
        router.replace(registerResult.redirectTo);
        toastSuccess(t("register.successMessage"));
      } else {
        router.replace("/login");
        toastSuccess(t("register.successMessage"));
      }
      setIsLoading(false);
    }
  });

  return (
    <div className="relative h-full">
      <div className="flex h-full flex-row items-center px-4 py-6 md:px-20">
        <form className="mt-4 flex w-full flex-col items-center space-y-2 md:space-y-4" onSubmit={onSubmit}>
          <h1 className="text-center text-2xl font-medium text-smart-cbt-green md:text-4xl">{t("register.title")}</h1>

          <input type="hidden" value="" {...registerField("citizenId")} />
          <input type="hidden" value="" {...registerField("dateOfBirthString")} />
          <input type="hidden" value={initialMTokenProfile?.notification ? "true" : "false"} {...registerField("notification")} />
          <input type="hidden" value={isMToken ? "true" : "false"} {...registerField("isMToken")} />

          {isMToken && (
            <>
              <FloatingLabelTextInput
                placeholder="ชื่อ"
                type="text"
                name="firstName"
                control={control}
                readOnly={lockFirstName}
              />
              <FloatingLabelTextInput
                placeholder="นามสกุล"
                type="text"
                name="lastName"
                control={control}
                readOnly={lockLastName}
              />
            </>
          )}

          <FloatingLabelTextInput
            placeholder={t("global.email")}
            type="email"
            name="email"
            control={control}
            readOnly={lockEmail}
            errorMessage={errors?.email?.message}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.keyCode == 32) {
                e.preventDefault();
              }
            }}
          />

          <FloatingLabelTextInput
            placeholder={t("global.password")}
            type="password"
            name="password"
            control={control}
            useMessage={errors.password?.type == "invalid_type" ? false : true}
            errorMessage={errors?.password?.message}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.keyCode == 32) {
                e.preventDefault();
              }
            }}
          />
          <FloatingLabelTextInput
            placeholder={t("register.confirmPassword")}
            type="password"
            name="confirmPassword"
            control={control}
            useMessage={errors.confirmPassword?.type == "invalid_type" ? false : true}
            errorMessage={errors?.confirmPassword?.message}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.keyCode == 32) {
                e.preventDefault();
              }
            }}
          />

          <FloatingLabelTextInput
            placeholder={t("register.phoneNumber")}
            type="tel"
            maxLength={10}
            name="phoneNumber"
            control={control}
            readOnly={lockMobile}
            errorMessage={errors?.phoneNumber?.message}
            onInput={validatePhone}
          />
          <Button
            intent={isSubmitting || isLoading ? "disabled" : "primary"}
            type="submit"
            className="px-2 md:max-w-full"
            disabled={isSubmitting || isLoading}
          >
            <p className="text-sm">{t("register.register")}</p>
          </Button>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 pt-4 md:pt-8">
            <p className="text-sm text-smart-cbt-medium-grey">{t("register.haveAnAccount")}</p>
            <NextLink className="h-auto p-0 text-sm underline" href={"/login"} intent={"whiteButton"} size={"medium"}>
              {t("global.login")}
            </NextLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
