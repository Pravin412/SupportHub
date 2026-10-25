import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AgentDto, AgentPasswordDto, AgentUpdateDto } from "./agent.dto";
import { AgentService } from "../agents/agent.service";

@ApiTags("agents")
@ApiBearerAuth()
@Controller()
export class AgentsController {
  constructor(private agents: AgentService) {}

  @Get("projects/:id/agents")
  list(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.agents.agents(userId, id);
  }

  @Get("projects/:id/agents/lookup")
  lookup(@CurrentUser() userId: string, @Param("id") id: string, @Query("email") email?: string) {
    return this.agents.lookupAgent(userId, id, email ?? "");
  }

  @Post("projects/:id/agents")
  create(@CurrentUser() userId: string, @Param("id") id: string, @Body() dto: AgentDto) {
    return this.agents.createAgent(userId, id, dto);
  }

  @Put("projects/:id/agents/:memberId/password")
  updatePassword(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body() dto: AgentPasswordDto
  ) {
    return this.agents.updateAgentPassword(userId, id, memberId, dto.password);
  }

  @Put("projects/:id/agents/:memberId")
  update(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body() dto: AgentUpdateDto
  ) {
    return this.agents.updateAgent(userId, id, memberId, dto);
  }

  @Delete("projects/:id/agents/:memberId")
  remove(@CurrentUser() userId: string, @Param("id") id: string, @Param("memberId") memberId: string) {
    return this.agents.removeAgent(userId, id, memberId);
  }
}
