import api, { USE_MOCK } from "../lib/apiClient";
import { delay } from "../lib/mockUtils";

export async function uploadAvatar(file) {
  if (USE_MOCK) {
    await delay(300);
    // Mock mode mein sirf browser ka temporary link, refresh par khatam ho jata hai
    return { url: URL.createObjectURL(file) };
  }
  const formData = new FormData();
  formData.append("file", file); // backend isi naam ("file") se file uthata hai
  const { data } = await api.post("/uploads/avatar", formData);
  return data;
}