import { ChakraProvider, Container } from "@chakra-ui/react";
import Dashboard from "@components/Dashboard";
import MessageForm from "@components/MessageForm";
import AuthWrapper from "@wrappers/AuthWrapper";
import Navbar from "@wrappers/Navbar";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <AuthWrapper>
        <BrowserRouter>
          <Navbar />
          
          <Container maxW="container.lg" pt="2em">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/feedback" element={<MessageForm />} />
            </Routes>
          </Container>
        </BrowserRouter>
      </AuthWrapper>
    </ChakraProvider>
  </React.StrictMode>
);
