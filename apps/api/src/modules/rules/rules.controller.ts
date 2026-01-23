import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RulesService, RuleSuggestion } from './rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { JwtPayload } from '../../shared/types';

class CreateRuleDto {
  pattern: string;
  matchType: 'contains' | 'startsWith' | 'exact' | 'regex';
  categoryId: string;
  categoryLabel: string;
  merchant?: string;
  isRecurring?: boolean;
  priority?: number;
}

class UpdateRuleDto {
  pattern?: string;
  matchType?: 'contains' | 'startsWith' | 'exact' | 'regex';
  categoryId?: string;
  categoryLabel?: string;
  merchant?: string;
  isRecurring?: boolean;
  priority?: number;
  isActive?: boolean;
}

class LearnFromCorrectionDto {
  transactionId: string;
  oldCategoryId: string;
  newCategoryId: string;
  newCategoryLabel: string;
}

class AcceptSuggestionDto {
  pattern: string;
  matchType: 'contains' | 'startsWith' | 'exact';
  categoryId: string;
  categoryLabel: string;
  confidence: number;
}

class ApplyRulesDto {
  description: string;
}

@UseGuards(JwtAuthGuard)
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  /**
   * Get all rules for the current user
   * GET /rules
   */
  @Get()
  async getRules(@User() user: JwtPayload) {
    return this.rulesService.getRules(user.id);
  }

  /**
   * Get rule statistics
   * GET /rules/stats
   */
  @Get('stats')
  async getStats(@User() user: JwtPayload) {
    return this.rulesService.getRuleStats(user.id);
  }

  /**
   * Apply rules to a description and get matching category
   * POST /rules/apply
   */
  @Post('apply')
  async applyRules(@User() user: JwtPayload, @Body() dto: ApplyRulesDto) {
    const result = await this.rulesService.applyRules(user.id, dto.description);
    return { match: result };
  }

  /**
   * Create a new rule
   * POST /rules
   */
  @Post()
  async createRule(@User() user: JwtPayload, @Body() dto: CreateRuleDto) {
    return this.rulesService.createRule(user.id, dto);
  }

  /**
   * Learn from user correction and get suggestion
   * POST /rules/learn
   */
  @Post('learn')
  async learnFromCorrection(
    @User() user: JwtPayload,
    @Body() dto: LearnFromCorrectionDto,
  ) {
    return this.rulesService.learnFromCorrection(
      user.id,
      dto.transactionId,
      dto.oldCategoryId,
      dto.newCategoryId,
      dto.newCategoryLabel,
    );
  }

  /**
   * Accept a rule suggestion
   * POST /rules/accept-suggestion
   */
  @Post('accept-suggestion')
  async acceptSuggestion(
    @User() user: JwtPayload,
    @Body() dto: AcceptSuggestionDto,
  ) {
    const suggestion: RuleSuggestion = {
      ...dto,
      exampleTransactions: [],
    };
    return this.rulesService.acceptSuggestion(user.id, suggestion);
  }

  /**
   * Update a rule
   * PATCH /rules/:id
   */
  @Patch(':id')
  async updateRule(
    @User() user: JwtPayload,
    @Param('id') ruleId: string,
    @Body() dto: UpdateRuleDto,
  ) {
    return this.rulesService.updateRule(user.id, ruleId, dto);
  }

  /**
   * Delete a rule
   * DELETE /rules/:id
   */
  @Delete(':id')
  async deleteRule(@User() user: JwtPayload, @Param('id') ruleId: string) {
    await this.rulesService.deleteRule(user.id, ruleId);
    return { success: true };
  }
}
