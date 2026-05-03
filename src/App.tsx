import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { ProtectedRoute, AdminRoute, ManagerRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Products from "./pages/dashboard/Products";
import Orders from "./pages/dashboard/Orders";
import POSInterface from "./pages/dashboard/POSInterface";
import Staff from "./pages/dashboard/Staff";
import Reports from "./pages/dashboard/Reports";
import SettingsPage from "./pages/dashboard/Settings";
import Subscribe from "./pages/dashboard/Subscribe";
import Suppliers from "./pages/dashboard/Suppliers";
import Stock from "./pages/dashboard/Stock";
import SchoolHome from "./pages/dashboard/school/SchoolHome";
import SchoolClasses from "./pages/dashboard/school/SchoolClasses";
import SchoolStudents from "./pages/dashboard/school/SchoolStudents";
import SchoolTeachers from "./pages/dashboard/school/SchoolTeachers";
import SchoolAttendance from "./pages/dashboard/school/SchoolAttendance";
import SchoolExams from "./pages/dashboard/school/SchoolExams";
import SchoolFees from "./pages/dashboard/school/SchoolFees";
import SchoolAnnouncements from "./pages/dashboard/school/SchoolAnnouncements";
import TeacherPortal from "./pages/portal/TeacherPortal";
import StudentPortal from "./pages/portal/StudentPortal";
import ParentPortal from "./pages/portal/ParentPortal";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import AdminBusinessDetail from "./pages/admin/AdminBusinessDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><ManagerRoute><DashboardHome /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/pos" element={<ProtectedRoute><POSInterface /></ProtectedRoute>} />
              <Route path="/dashboard/products" element={<ProtectedRoute><ManagerRoute><Products /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/orders" element={<ProtectedRoute><ManagerRoute><Orders /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/staff" element={<ProtectedRoute><ManagerRoute><Staff /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute><ManagerRoute><Reports /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><ManagerRoute><SettingsPage /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/subscribe" element={<ProtectedRoute><ManagerRoute><Subscribe /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/suppliers" element={<ProtectedRoute><ManagerRoute><Suppliers /></ManagerRoute></ProtectedRoute>} />
              <Route path="/dashboard/stock" element={<ProtectedRoute><ManagerRoute><Stock /></ManagerRoute></ProtectedRoute>} />

              {/* School admin routes */}
              <Route path="/school" element={<ProtectedRoute><ManagerRoute><SchoolHome /></ManagerRoute></ProtectedRoute>} />
              <Route path="/school/classes" element={<ProtectedRoute><ManagerRoute><SchoolClasses /></ManagerRoute></ProtectedRoute>} />
              <Route path="/school/students" element={<ProtectedRoute><ManagerRoute><SchoolStudents /></ManagerRoute></ProtectedRoute>} />
              <Route path="/school/teachers" element={<ProtectedRoute><ManagerRoute><SchoolTeachers /></ManagerRoute></ProtectedRoute>} />
              <Route path="/school/attendance" element={<ProtectedRoute><SchoolAttendance /></ProtectedRoute>} />
              <Route path="/school/exams" element={<ProtectedRoute><SchoolExams /></ProtectedRoute>} />
              <Route path="/school/fees" element={<ProtectedRoute><ManagerRoute><SchoolFees /></ManagerRoute></ProtectedRoute>} />
              <Route path="/school/announcements" element={<ProtectedRoute><ManagerRoute><SchoolAnnouncements /></ManagerRoute></ProtectedRoute>} />

              {/* Role portals */}
              <Route path="/portal/teacher" element={<ProtectedRoute><TeacherPortal /></ProtectedRoute>} />
              <Route path="/portal/student" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />
              <Route path="/portal/parent" element={<ProtectedRoute><ParentPortal /></ProtectedRoute>} />

              <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
              <Route path="/admin/businesses" element={<AdminRoute><AdminBusinesses /></AdminRoute>} />
              <Route path="/admin/businesses/:id" element={<AdminRoute><AdminBusinessDetail /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
