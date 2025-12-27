export const phoneValidation = [
  {
    validator: (_, value) => {
      const digits = value?.replace(/\D/g, "") || "";

      // Case 1: Empty field
      if (!digits) {
        return Promise.reject("Please enter a phone number");
      }

      // Case 2: Less or more than 10 digits
      if (digits.length !== 10) {
        return Promise.reject("Phone number must be 10 digits");
      }

      // Valid
      return Promise.resolve();
    },
  },
];

/* ---------------- ZIP CODE ---------------- */
export const zipCodeValidation = [
  { required: true, message: "Please enter a Zip Code" },
  {
    pattern: /^\d{5}$/,
    message: "ZIP code must be 5 digits",
  },
];

/* ---------------- EMAIL ---------------- */
export const emailValidation = [
  { required: true, message: "Please enter an Email" },
  { type: "email", message: "Enter a valid email address" },
];

/* ---------------- NAME (First / Last / City) ---------------- */
export const nameValidation = (fieldLabel = "This field") => [
  { required: true, message: `Please enter ${fieldLabel}` },
  {
    pattern: /^[A-Za-z\s]+$/,
    message: `${fieldLabel} must contain only letters`,
  },
];

export const formatPhoneNumber = (value) => {
        if (!value) return "";
        const digits = value.replace(/\D/g, "");

        if (digits.length !== 10) return value;

        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };