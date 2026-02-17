import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SessionProvider } from "./context/SessionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import VerifyPhone from "./pages/VerifyPhone";
import SessionStart from "./pages/SessionStart";
import OrderPickup from "./pages/OrderPickup";
import RestaurantWait from "./pages/RestaurantWait";
import OrderDropoff from "./pages/OrderDropoff";
import PostOrderSurveyImmediate from "./pages/PostOrderSurveyImmediate";
import PostOrderSurveyDelayed from "./pages/PostOrderSurveyDelayed";
import SessionEnd from "./pages/SessionEnd";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-phone" element={<VerifyPhone />} />

              {/* Session Routes */}
              <Route
                path="/session-start"
                element={
                  <ProtectedRoute>
                    <SessionStart />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/session-end"
                element={
                  <ProtectedRoute>
                    <SessionEnd />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />

            <Route
              path="/order-pickup"
              element={
                <ProtectedRoute>
                  <OrderPickup />
                </ProtectedRoute>
              }
            />

            <Route
              path="/restaurant-wait"
              element={
                <ProtectedRoute>
                  <RestaurantWait />
                </ProtectedRoute>
              }
            />

            <Route
              path="/order-dropoff"
              element={
                <ProtectedRoute>
                  <OrderDropoff />
                </ProtectedRoute>
              }
            />

              <Route
                path="/post-order-survey-immediate"
                element={
                  <ProtectedRoute>
                    <PostOrderSurveyImmediate />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/post-order-survey-delayed"
                element={
                  <ProtectedRoute>
                    <PostOrderSurveyDelayed />
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to home if not auth */}
              <Route path="/home" element={<Navigate to="/" replace />} />

              {/* Catch All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
