import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Field, { inputClass } from "../ui/Field";
import { contactSchema } from "../../schemas/contactSchema";
import { useCreateContact, useUpdateContact } from "../../hooks/useContacts";
import { useUploadAvatar } from "../../hooks/useUploads";
import { getErrorMessage } from "../../lib/apiClient";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB (backend ki limit se match)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const defaults = { name: "", role: "", company: "", email: "", phone: "", city: "" };

const toFormValues = (contact) => ({
  name: contact.name,
  role: contact.role,
  company: contact.company,
  email: contact.email,
  phone: contact.phone,
  city: contact.city,
});

export default function ContactFormModal({ open, onClose, contact = null }) {
  const isEdit = Boolean(contact);
  const [serverError, setServerError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const fileInput = useRef(null);

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const uploadAvatar = useUploadAvatar();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(contactSchema), defaultValues: defaults });

  const nameValue = watch("name");

  useEffect(() => {
    if (open) {
      reset(contact ? toFormValues(contact) : defaults);
      setAvatarUrl(contact?.avatarUrl ?? null);
      setServerError("");
      setPhotoError("");
    }
  }, [open, contact, reset]);

  const handleClose = () => {
    setServerError("");
    setPhotoError("");
    onClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // taake wahi file dobara chuni ja sake
    if (!file) return;

    setPhotoError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      setPhotoError("Image must be 2 MB or smaller");
      return;
    }

    try {
      const { url } = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(url);
    } catch (err) {
      setPhotoError(getErrorMessage(err));
    }
  };

  const onSubmit = async (values) => {
    setServerError("");
    const payload = { ...values, avatarUrl };
    try {
      if (isEdit) {
        await updateContact.mutateAsync({ id: contact.id, payload });
      } else {
        await createContact.mutateAsync(payload);
      }
      handleClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} title={isEdit ? "Edit Contact" : "Add Contact"} onClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="flex items-center gap-4">
          <Avatar name={nameValue || "?"} size="lg" src={avatarUrl} />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploadAvatar.isPending}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                {uploadAvatar.isPending
                  ? "Uploading..."
                  : avatarUrl
                  ? "Change photo"
                  : "Upload photo"}
              </button>
              {avatarUrl && !uploadAvatar.isPending && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="text-sm font-medium text-rose-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">JPG, PNG or WEBP, up to 2 MB</p>
            {photoError && <p className="mt-1 text-xs text-rose-600">{photoError}</p>}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} />
          </Field>
          <Field label="Role" error={errors.role?.message}>
            <input className={inputClass} {...register("role")} />
          </Field>
          <Field label="Company" error={errors.company?.message}>
            <input className={inputClass} {...register("company")} />
          </Field>
          <Field label="City" error={errors.city?.message}>
            <input className={inputClass} {...register("city")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register("email")} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input className={inputClass} {...register("phone")} />
          </Field>
        </div>

        {serverError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploadAvatar.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update Contact" : "Save Contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
}