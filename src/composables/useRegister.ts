import { useMutation } from "@tanstack/react-query";
import { Users } from "@/api/users";
import type { CreateUserRequest } from "@/api/users";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

export const registerSchema = yup.object({
  username: yup.string().required("Name is required"),
  email: yup.string().email("Email is invalid").required("Email is required"),
  password: yup.string().required("Password is required"),
  confirm: yup.string().required("Confirm password is required"),
});

type RegisterForm = yup.InferType<typeof registerSchema>;

export const useRegister = ({
  onSuccessAction,
  onErrorAction,
}: {
  onSuccessAction: () => void;
  onErrorAction: () => void;
}) => {
  const { register, handleSubmit } = useForm<RegisterForm>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm: "",
    },
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

  const createUser = handleSubmit((values) =>
    mutate({
      email: values.email,
      username: values.username,
      password: values.password,
    }),
  );

  return {
    createUser,
    register,
    isPending,
  };
};
