import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SkipAuth } from "../../common/decorators/skip-auth.decorator";
import { ProjectService } from "../project/project.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@Controller()
export class DashboardController {
  constructor(private projects: ProjectService) {}

  @Get("dashboard/summary")
  summary(@CurrentUser() userId: string, @Query("range") range?: "today" | "week" | "month" | "all") {
    return this.projects.dashboardSummary(userId, range);
  }

  @Get("search")
  search(@CurrentUser() userId: string, @Query("query") query?: string) {
    return this.projects.globalSearch(userId, query ?? "");
  }

  @SkipAuth()
  @Get("health")
  health() {
    return { ok: true, api: "up" };
  }
}
