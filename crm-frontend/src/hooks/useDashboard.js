import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../services/dashboardService";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 0,
    refetchOnMount: "always",
  });