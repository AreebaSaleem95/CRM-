import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Field, { inputClass } from "../ui/Field";
import { leadSchema } from "../../schemas/leadSchema";
import { leadStatuses, leadSources } from "../../constants/lead";
import { useCreateLead, useUpdateLead } from "../../hooks/useLeads";
import { useUploadAvatar } from "../../hooks/useUploads";
import { getErrorMessage } from "../../lib/apiClient";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB (backend ki limit se match)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const defaults = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "New",
  source: "Website",
  value: 0,
};

const toFormValues = (lead) => ({
  name: lead.name,
  company: lead.company,
  email: lead.email,
  phone: lead.phone,
  status: lead.status,
  source: lead.source,
  value: lead.value,
});

export default function LeadFormModal({ open, onClose, lead = null }) {
  const isEdit = Boolean(lead);
  const [serverError, setServerError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const fileInput = useRef(null);

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const uploadAvatar = useUploadAvatar();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(leadSchema), defaultValues: defaults });

  const nameValue = watch("name");

  // Modal khulte hi form ko sahi values se bhar do (edit: lead ki values, add: khali)
  useEffect(() => {
    if (open) {
      reset(lead ? toFormValues(lead) : defaults);
      setAvatarUrl(lead?.avatarUrl ?? null);
      setServerError("");
      setPhotoError("");
    }
  }, [open, lead, reset]);

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
        await updateLead.mutateAsync({ id: lead.id, payload });
      } else {
        await createLead.mutateAsync(payload);
      }
      handleClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} title={isEdit ? "Edit Lead" : "Add Lead"} onClose={handleClose}>
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
          <Field label="Company" error={errors.company?.message}>
            <input className={inputClass} {...register("company")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register("email")} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input className={inputClass} {...register("phone")} />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select className={inputClass} {...register("status")}>
              {leadStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source" error={errors.source?.message}>
            <select className={inputClass} {...register("source")}>
              {leadSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Value (PKR)" error={errors.value?.message}>
            <input
              type="number"
              className={inputClass}
              {...register("value", { valueAsNumber: true })}
            />
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
            {isSubmitting ? "Saving..." : isEdit ? "Update Lead" : "Save Lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}