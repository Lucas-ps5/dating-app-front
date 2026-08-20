import { createBrowserRouter } from "react-router";
import HomePage from "@/pages/HomePage";
import RegisterPage from "@/pages/Register";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";

const router = createBrowserRouter([
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute children={<AppLayout />} />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
    ],
  },
]);

export default router;

