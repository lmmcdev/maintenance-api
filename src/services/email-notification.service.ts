import axios from 'axios';
import { env } from '../config/env';

interface EmailPayload {
  to_user: string;
  email_subject: string;
  email_body: string;
}
export class EmailNotificationService {
  private functionUrl: string;

  constructor() {
    this.functionUrl = env.externalServices.sendEmailFunctionUrl;
  }

  public async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      await axios.post(this.functionUrl, payload);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
