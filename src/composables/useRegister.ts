import { useMutation } from "@tanstack/react-query";
import { Users } from "@/api/users";
import type { CreateUserRequest } from "@/api/users";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

// ── Step 1 schema ──────────────────────────────────────────────────────────────
export const step1Schema = yup.object({
  username: yup.string().required("Name is required"),
  email: yup.string().email("Email is invalid").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirm: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
});

// ── Step 2 schema ──────────────────────────────────────────────────────────────
export const step2Schema = yup.object({
  gender: yup.string().required("Gender is required"),
  dateOfBirth: yup
    .string()
    .required("Date of birth is required")
    .test("age", "You must be at least 18 years old", (value) => {
      if (!value) return false;
      const dob = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      return (
        age > 18 ||
        (age === 18 && (m > 0 || (m === 0 && today.getDate() >= dob.getDate())))
      );
    }),
  latitude: yup
    .number()
    .typeError("Latitude must be a number")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: yup
    .number()
    .typeError("Longitude must be a number")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

// ── Combined schema (full form) ────────────────────────────────────────────────
export const registerSchema = step1Schema.concat(step2Schema);

export type RegisterForm = yup.InferType<typeof registerSchema>;
export type Step1Form = yup.InferType<typeof step1Schema>;
export type Step2Form = yup.InferType<typeof step2Schema>;

export const useRegister = ({
  onSuccessAction,
  onErrorAction,
}: {
  onSuccessAction: () => void;
  onErrorAction: () => void;
}) => {
  const form = useForm<RegisterForm>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm: "",
      gender: "",
      dateOfBirth: "",
      latitude: undefined,
      longitude: undefined,
    },
    mode: "onTouched",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (user: CreateUserRequest) => {
      const { data, error } = await Users.registerUser({ body: user });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      onSuccessAction();
    },
    onError: () => {
      onErrorAction();
    },
  });

  const createUser = form.handleSubmit((values) =>
    mutate({
      email: values.email,
      username: values.username,
      password: values.password,
      gender: values.gender as "male" | "female",
      birthdate: values.dateOfBirth,
      latitude: values.latitude,
      longitude: values.longitude,
    }),
  );

  return {
    form,
    createUser,
    isPending,
  };
};
