import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getLeads, createLead, updateLead, deleteLead } from "../services/leadsService";

export const useLeads = (filters) =>
  useQuery({
    queryKey: ["leads", filters],
    queryFn: () => getLeads(filters),
    placeholderData: keepPreviousData,
  });

function useInvalidateLeads() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export const useCreateLead = () => {
  const invalidate = useInvalidateLeads();
  return useMutation({ mutationFn: createLead, onSuccess: invalidate });
};

export const useUpdateLead = () => {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ id, payload }) => updateLead(id, payload),
    onSuccess: invalidate,
  });
};

export const useDeleteLead = () => {
  const invalidate = useInvalidateLeads();
  return useMutation({ mutationFn: deleteLead, onSuccess: invalidate });
};