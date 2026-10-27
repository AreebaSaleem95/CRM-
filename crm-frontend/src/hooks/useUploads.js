import { useMutation } from "@tanstack/react-query";
import { uploadAvatar } from "../services/uploadsService";

export const useUploadAvatar = () => useMutation({ mutationFn: uploadAvatar });