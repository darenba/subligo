import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DesignService } from './design.service.js';

@ApiTags('design')
@Controller('design')
export class DesignController {
  constructor(private readonly design: DesignService) {}

  @Post('sessions')
  createSession(@Body() body: unknown, @Request() req?: any) {
    return this.design.createSession(body, req?.user?.sub);
  }

  @Get('sessions')
  listSessions(@Request() req?: any) {
    return this.design.listSessions(req?.user?.sub);
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string) {
    return this.design.getSession(id);
  }

  @ApiBearerAuth()
  @Patch('sessions/:id')
  update(@Param('id') id: string, @Body() body: unknown, @Request() req?: any) {
    return this.design.updateSession(id, body, req?.user?.sub);
  }

  @Post('assets')
  @UseInterceptors(FileInterceptor('file'))
  uploadAsset(
    @UploadedFile() file: any,
    @Request() req?: any,
  ) {
    return this.design.uploadAsset(file, req?.user?.sub);
  }
}
