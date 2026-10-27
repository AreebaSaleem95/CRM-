import { useMutation } from "@tanstack/react-query";
import { draftFollowUp } from "../services/aiService";

export const useDraftFollowUp = () => useMutation({ mutationFn: draftFollowUp });