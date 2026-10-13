import { createBrowserRouter, Navigate } from "react-router";
import RegisterPage from "@/pages/Register";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import DiscoverPage from "@/pages/Discover";
import { UserProfilePage } from "@/pages/UserProfile";
import HomePage from "@/pages/HomePage";
import { MyProfilePage } from "@/pages/MyProfile";
import { EditProfilePage } from "@/pages/EditProfile";

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
        element: <Navigate to="/discover" replace />,
      },
      {
        path: "/dashboard",
        element: <HomePage />,
      },
      {
        path: "/discover",
        element: <DiscoverPage />,
      },
      {
        path: "/profile",
        element: <MyProfilePage />,
      },
      {
        path: "/profile/edit",
        element: <EditProfilePage />,
      },
      {
        path: "/users/:id",
        element: <UserProfilePage />,
      },
    ],
  },
]);

export default router;
