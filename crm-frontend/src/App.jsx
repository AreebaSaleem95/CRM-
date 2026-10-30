import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Contacts from "./pages/Contacts";
import DealsPipeline from "./pages/DealsPipeline";
import Tasks from "./pages/Tasks";
import CalendarView from "./pages/CalendarView";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/deals" element={<DealsPipeline />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}