export type DonorType =
  | "Individual"
  | "Local Individual"
  | "Diaspora Individual"
  | "Organization"
  | "Government"
  | "Foundation"
  | "Church";
export type DonorCategory = "Major donor" | "Recurring" | "One-time" | "In-kind";
export type DonorStatus = "Active" | "Lapsed" | "Prospective";

// "Individual" is legacy (kept so old rows still type-check) — new donors
// get one of the two more specific variants instead.
export function isIndividualDonorType(type: DonorType): boolean {
  return type === "Individual" || type === "Local Individual" || type === "Diaspora Individual";
}

export type Donor = {
  id: string;
  name: string;
  donorType: DonorType;
  phone?: string;
  email?: string;
  address?: string;
  category: DonorCategory;
  status: DonorStatus;
  notes?: string;
  dateAdded: string;
  // Organization/Government/Foundation/Church only — undefined for Individual.
  contactPersonName?: string;
  registrationId?: string;
};

// Lightweight shape used for the cached donor list (donors list, give flow).
export type DonorSummary = Pick<Donor, "id" | "name" | "donorType" | "category" | "status">;

export type PaymentMethod = "Cash" | "Bank transfer" | "Mobile money" | "Cheque" | "In-kind";
export type DonationType = "One-time" | "Pledge installment";
export type DonationStatus = "Received" | "Pending" | "Partial";

export type Donation = {
  id: string;
  donorId: string;
  dateReceived: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  purpose: string;
  type: DonationType;
  pledgeId?: string;
  receiptNumber: string;
  status: DonationStatus;
  receiptImageUrl?: string;
};

export type PledgeFrequency = "One-time" | "Monthly" | "Quarterly" | "Annual";

export type Pledge = {
  id: string;
  donorId: string;
  totalAmount: number;
  currency: string;
  frequency: PledgeFrequency;
  startDate: string;
  endDate?: string;
  nextDueDate?: string;
};

export type ReminderType = "Follow-up" | "Pledge due" | "Report deadline" | "Thank-you";
export type ReminderStatus = "Pending" | "Done";

export type Reminder = {
  id: string;
  type: ReminderType;
  donorId?: string;
  dueDate: string;
  note: string;
  status: ReminderStatus;
};
