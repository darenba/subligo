import { Body, Controller, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ExecuteAgentDto } from './dto/execute-agent.dto.js';
import { ReviewAgentFindingDto } from './dto/review-agent-finding.dto.js';
import { UpdateAgentPromptDto } from './dto/update-agent-prompt.dto.js';
import { AgentsService } from './agents.service.js';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get('definitions')
  listDefinitions() {
    return this.agents.listDefinitions();
  }

  @Get('runs')
  listRuns(@Query('agentId') agentId?: string, @Query('limit') limit = '20') {
    return this.agents.listRuns(agentId, Number(limit));
  }

  @Get('runs/:id')
  getRun(@Param('id') id: string) {
    return this.agents.getRun(id);
  }

  @Get('findings')
  listFindings(@Query('agentId') agentId?: string, @Query('limit') limit = '20') {
    return this.agents.listFindings(agentId, Number(limit));
  }

  @Get('review-queue')
  listReviewQueue(@Query('limit') limit = '20') {
    return this.agents.listReviewQueue(Number(limit));
  }

  @Get('prompts')
  listPrompts(@Query('agentId') agentId?: string) {
    return this.agents.listPrompts(agentId);
  }

  @Patch('prompts/:key')
  updatePrompt(
    @Param('key') key: string,
    @Body() body: UpdateAgentPromptDto,
    @Request() req: { user?: { sub?: string } },
  ) {
    return this.agents.updatePrompt(key, body, req.user?.sub);
  }

  @Get('social-signals')
  listSocialSignals(@Query('limit') limit = '20') {
    return this.agents.listSocialSignals(Number(limit));
  }

  @Post('execute')
  execute(@Body() body: ExecuteAgentDto, @Request() req: { user?: { sub?: string } }) {
    return this.agents.executeAgent({
      agentId: body.agentId,
      actorUserId: req.user?.sub,
      mode: body.mode,
      input: body.input,
    });
  }

  @Post('execute/initial-wave')
  executeInitialWave(@Request() req: { user?: { sub?: string } }) {
    return this.agents.executeInitialWave(req.user?.sub);
  }

  @Post('execute/phase-two-wave')
  executePhaseTwoWave(@Request() req: { user?: { sub?: string } }) {
    return this.agents.executePhaseTwoWave(req.user?.sub);
  }

  @Post('findings/:id/review')
  reviewFinding(
    @Param('id') id: string,
    @Body() body: ReviewAgentFindingDto,
    @Request() req: { user?: { sub?: string } },
  ) {
    return this.agents.reviewFinding(id, body.decision, req.user?.sub, body.note);
  }
}
