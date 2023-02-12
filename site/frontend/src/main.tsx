import { ChakraProvider } from "@chakra-ui/react";
import Dashboard from "@components/Dashboard";
import MessageForm from "@components/MessageForm";
import AuthWrapper from "@wrappers/AuthWrapper";
import Navbar from "@wrappers/Navbar";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Helmet } from "react-helmet";
import AdminAuth from "@components/AdminAuth";
import AdminDashboard from "@components/AdminDashboard";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider>
      <HashRouter>
        <AuthWrapper>
          <Helmet>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta property="og:title" content="Quizicist: AI-powered quiz generator" />
            <meta property="og:type" content="article" />
            <meta property="og:description" content="Need to write a multiple-choice quiz? With your lecture notes or textbook pages, Quizicist can generate a quiz in minutes." />
            <meta name="twitter:card" content="summary" />
          </Helmet>

          <Navbar />

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/feedback" element={<MessageForm />} />
            <Route path="/admin/authenticate" element={<AdminAuth />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </AuthWrapper>
      </HashRouter>
    </ChakraProvider>
  </React.StrictMode>
);
