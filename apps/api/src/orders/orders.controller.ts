import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CheckoutDto } from './dto/order.dto.js';
import { OrdersService, type CreateOrderDto } from './orders.service.js';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.orders.create({
      ...dto,
      customerId: dto.customerId ?? req?.user?.sub,
    });
  }

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.orders.checkout(dto);
  }

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.orders.findAll(customerId);
  }

  @Get('production-queue')
  getProductionQueue() {
    return this.orders.getProductionQueue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req: any,
  ) {
    return this.orders.updateStatus(id, body.status, req?.user?.sub);
  }

  @Post(':id/confirm-payment')
  confirmPayment(@Param('id') id: string, @Request() req: any) {
    return this.orders.confirmPayment(id, req?.user?.sub);
  }
}
