import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import NodeCache from 'node-cache';
import { IEmail } from '@/shared-libs/interfaces/email.interface';
import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';

export class Microsoft365 implements IEmail {
  private readonly client: AxiosInstance;
  private readonly tokenCache: NodeCache;

  constructor() {
    this.client = axios.create();
    this.tokenCache = new NodeCache({ stdTTL: 60 * 50 }); // Cache token for 50 minutes
  }

  async send(data: any, bodyTemplate: any): Promise<void> {
    const { to, subject, cc, bcc, attachmentPath } = data;

    const emailBody: any = {
      message: {
        subject: subject || 'Astra Car Valuation',
        body: {
          contentType: 'html',
          content: bodyTemplate,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
    };

    if (cc) {
      emailBody.message.ccRecipients = [
        {
          emailAddress: {
            address: cc,
          },
        },
      ];
    }

    if (bcc) {
      emailBody.message.bccRecipients = [
        {
          emailAddress: {
            address: bcc,
          },
        },
      ];
    }

    if (attachmentPath) {
      const attachmentContent = fs
        .readFileSync(attachmentPath)
        .toString('base64');
      emailBody.message.attachments = [
        {
          '@odata.type': '#microsoft.graph.fileAttachment',
          '@odata.mediaContentType': 'application/pdf',
          name: path.basename(attachmentPath),
          contentType: 'application/pdf',
          contentBytes: attachmentContent,
        },
      ];
    }

    try {
      const token = await this.getToken();
      await this.client.post(
        SecretManager.env.MICROSOFT_0365_SEND_EMAIL,
        emailBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  private async getToken(): Promise<string> {
    const cachedToken = this.tokenCache.get<string>('token_0365');
    if (cachedToken) {
      return cachedToken;
    }

    try {
      const response = await this.client.post(
        SecretManager.env.MICROSOFT_0365_TOKEN,
        new URLSearchParams({
          grant_type: SecretManager.env.MICROSOFT_0365_GRANT_TYPE,
          client_id: SecretManager.env.MICROSOFT_0365_CLIENT_ID,
          client_secret: SecretManager.env.MICROSOFT_0365_CLIENT_SECRET,
          scope: SecretManager.env.MICROSOFT_0365_SCOPE,
        }).toString()
      );

      const tokenData = response.data;
      this.tokenCache.set('token_0365', tokenData.access_token);
      return tokenData.access_token;
    } catch (error) {
      console.error('Failed to get token:', error);
      throw new Error('Failed to get token');
    }
  }
}
