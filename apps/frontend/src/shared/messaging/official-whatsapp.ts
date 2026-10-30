// Official WhatsApp dispatch stays hidden until the Meta channel is validated for the tenant.
export function isOfficialWhatsAppEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WHATSAPP_OFFICIAL_ENABLED === 'true';
}
