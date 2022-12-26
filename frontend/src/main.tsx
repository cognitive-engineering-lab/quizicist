import { ChakraProvider } from "@chakra-ui/react";
import Dashboard from "@components/Dashboard";
import MessageForm from "@components/MessageForm";
import AuthWrapper from "@wrappers/AuthWrapper";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/feedback",
    element: <MessageForm />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <AuthWrapper>
        <RouterProvider router={router} />
      </AuthWrapper>
    </ChakraProvider>
  </React.StrictMode>
);
