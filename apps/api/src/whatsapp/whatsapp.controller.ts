import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { WhatsappService } from './whatsapp.service.js';

interface WhatsAppWebhookBody {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        contacts?: Array<{ wa_id: string; profile: { name: string } }>;
        messages?: Array<{
          id: string;
          from: string;
          type: string;
          timestamp: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsapp: WhatsappService) {}

  /** Verification handshake required by Meta */
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ) {
    const expected = process.env['WHATSAPP_VERIFY_TOKEN'] ?? 'subligo-verify';
    if (mode === 'subscribe' && token === expected) {
      this.logger.log('WhatsApp webhook verified');
      return Number(challenge);
    }
    return 'FORBIDDEN';
  }

  /** Incoming message events from Meta */
  @Post('webhook')
  @HttpCode(200)
  async receive(@Body() body: WhatsAppWebhookBody) {
    const firstMessage = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (firstMessage) {
      this.logger.log(`Incoming WA message from ${firstMessage.from}: ${firstMessage.text?.body ?? ''}`);
    }

    await this.whatsapp.handleInbound(body as Record<string, any>);
    return 'OK';
  }
}
