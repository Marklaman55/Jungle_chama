class WhatsAppService {
  async connectWhatsApp() {
    console.log('WhatsApp connection stub initialized');
  }

  async sendMessage(phone: string, message: string) {
    console.log(`Sending WhatsApp message to ${phone}: ${message}`);
    return true;
  }

  async notifyAdminsViaWhatsApp(message: string) {
    console.log(`Notifying admins: ${message}`);
  }

  async addUserToWhatsAppGroup(userId: string) {
    console.log(`Adding user ${userId} to WhatsApp group (stub)`);
  }

  getStatus() {
    return 'connected';
  }

  getQRCode() {
    return null;
  }

  async logout() {
    console.log('WhatsApp logout (stub)');
  }
}

export const whatsappService = new WhatsAppService();
