export interface CreateContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string;
  createdAt: string;
}
