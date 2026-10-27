import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getContacts,
  getCities,
  createContact,
  updateContact,
  deleteContact,
} from "../services/contactsService";

export const useContacts = (filters) =>
  useQuery({
    queryKey: ["contacts", filters],
    queryFn: () => getContacts(filters),
    placeholderData: keepPreviousData,
  });

export const useCities = () =>
  useQuery({ queryKey: ["contact-cities"], queryFn: getCities });

function useInvalidateContacts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["contacts"] });
    qc.invalidateQueries({ queryKey: ["contact-cities"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export const useCreateContact = () => {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: createContact, onSuccess: invalidate });
};

export const useUpdateContact = () => {
  const invalidate = useInvalidateContacts();
  return useMutation({
    mutationFn: ({ id, payload }) => updateContact(id, payload),
    onSuccess: invalidate,
  });
};

export const useDeleteContact = () => {
  const invalidate = useInvalidateContacts();
  return useMutation({ mutationFn: deleteContact, onSuccess: invalidate });
};