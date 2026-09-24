import { useEffect, useState } from "react";
import { useAkMarathonMutation } from "@ak-marathon/sdk";
import type { BaseUser, UserStatus } from "@ak-marathon/sdk";
import { toast } from "sonner";
import { z } from "zod";
import { BaseModal } from "../../../components/BaseModal";
import { ApiDomainError } from "@rabstack/rab-react-sdk";
import { normalizeGhPhone } from "../../../utils";

/* ============================
   Schema
============================ */

const userSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z
    .string()
    .length(9, "Phone number must be 9 digits (without the leading 0)")
    .regex(/^[25][0-9]{8}$/, "Enter a valid Ghana mobile number (e.g. 24XXXXXXX)"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type UserFormData = z.infer<typeof userSchema>;

type StaffRole = "agent" | "admin";
type Mode = "create" | "edit";

interface UserModalProps {
  mode?: Mode;
  userRole: StaffRole;
  user?: BaseUser;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

/* ============================
   Component
============================ */

export function UserModal({
  mode = "create",
  userRole,
  user,
  onSuccess,
  trigger,
}: UserModalProps) {
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [role, setRole] = useState<StaffRole>(userRole);
  const [status, setStatus] = useState<UserStatus>("active");

  const [apiError, setApiError] = useState<string>();

  const [errors, setErrors] = useState<
    Partial<Record<keyof UserFormData, string>>
  >({});

  /* Prefill on edit */
  useEffect(() => {
    if (isEdit && user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: normalizeGhPhone(user.phone || ""),
        email: user.email || "",
      });
      setRole(user.role === "admin" ? "admin" : "agent");
      setStatus(user.status === "active" ? "active" : "suspended");
    }
  }, [user, isEdit]);

  /* ============================
     Phone Formatter
  ============================ */

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "").replace(/^0/, "");
    return `233${cleaned}`;
  };

  /* ============================
     Mutations
  ============================ */

  const createUser = useAkMarathonMutation("addAdminUser", {
    onSuccess: () => {
      toast.success("Staff member created successfully!");
      setFormData({ firstName: "", lastName: "", phone: "", email: "" });
      setErrors({});
      setApiError(undefined);
      onSuccess?.();
    },
    onError: (error: ApiDomainError) => {
      const messages: string[] =
        typeof error.getAllMessages === "function"
          ? error.getAllMessages()
          : [error?.message || "Failed to create staff member"];

      setApiError(messages.join(", "));
      toast.error(messages[0]);
    },
  });

  const updateUser = useAkMarathonMutation("updateAdminUser", {
    onSuccess: () => {
      toast.success("Staff member updated successfully!");
      setApiError(undefined);
      onSuccess?.();
    },
    onError: (error: ApiDomainError) => {
      const messages: string[] =
        typeof error.getAllMessages === "function"
          ? error.getAllMessages()
          : [error?.message || "Failed to update staff member"];

      setApiError(messages.join(", "));
      toast.error(messages[0]);
    },
  });

  /* ============================
     Submit
  ============================ */

  const handleSubmit = async (e: React.FormEvent, closeModal: () => void) => {
    e.preventDefault();
    setErrors({});
    setApiError(undefined);

    const result = userSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: any = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (isEdit && user?.id) {
        await updateUser.mutateAsync({
          params: { id: user.id },
          body: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            role,
            status,
            ...(formData.email ? { email: formData.email } : {}),
          },
        });
      } else {
        await createUser.mutateAsync({
          body: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formatPhone(formData.phone),
            role,
            ...(formData.email ? { email: formData.email } : {}),
          },
        });
      }
      closeModal();
    } catch (error) {
      // Error handled in mutation callbacks
      console.error("Submission error:", error);
    }
  };

  /* ============================
     UI
  ============================ */

  const isPending = createUser.isPending || updateUser.isPending;
  const title = isEdit
    ? `Edit ${capitalize(role)}`
    : `Add ${capitalize(userRole)}`;

  return (
    <BaseModal
      trigger={
        trigger || (
          <button className="px-4 py-2 bg-olive text-white rounded-lg hover:bg-olive/90 transition-colors">
            {`Add ${capitalize(userRole)}`}
          </button>
        )
      }
      title={title}
      description={isEdit ? "Update staff member details" : "Onboard a new staff member"}
      maxWidth="md"
    >
      {(closeModal) => (
        <form onSubmit={(e) => handleSubmit(e, closeModal)} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="First Name"
              value={formData.firstName}
              error={errors.firstName}
              onChange={(v: string) => setFormData({ ...formData, firstName: v })}
            />
            <InputField
              label="Last Name"
              value={formData.lastName}
              error={errors.lastName}
              onChange={(v: string) => setFormData({ ...formData, lastName: v })}
            />
          </div>

          {/* Phone */}
          <PhoneField
            value={formData.phone}
            disabled={isEdit}
            error={errors.phone}
            onChange={(v: string) => setFormData({ ...formData, phone: v })}
          />
          {isEdit && (
            <p className="text-xs text-muted-foreground -mt-2">
              Phone number cannot be changed
            </p>
          )}

          {/* Email */}
          <InputField
            label="Email (Optional)"
            type="email"
            value={formData.email}
            error={errors.email}
            onChange={(v: string) => setFormData({ ...formData, email: v })}
          />

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            {isEdit ? (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            ) : (
              <div className="px-4 py-3 bg-muted border border-input rounded-lg text-muted-foreground">
                {capitalize(userRole)}
              </div>
            )}
          </div>

          {/* Status Toggle (Edit mode only) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium mb-3">Account Status</label>
              <div className="flex items-center justify-between p-4 bg-muted/50 border border-input rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {status === "active" ? "Active" : "Suspended"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {status === "active"
                      ? "Staff member can access the portal"
                      : "Staff member cannot log in"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(status === "active" ? "suspended" : "active")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    status === "active" ? "bg-olive" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      status === "active" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {apiError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={isPending}
              className="flex-1 border border-border py-3 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-olive text-white py-3 rounded-lg hover:bg-olive/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
}

/* ============================
   Small Helpers
============================ */

function InputField({
  label,
  value,
  onChange,
  error,
  disabled,
  type = "text",
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-red-500" : "border-input"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function PhoneField({ value, onChange, error, disabled }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Phone Number</label>
      <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground">
          +233
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          maxLength={10}
          onChange={(e) => onChange(normalizeGhPhone(e.target.value))}
          className={`w-full px-4 py-3 border bg-background rounded-r-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-red-500" : "border-input"
          }`}
          placeholder="24XXXXXXX"
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
