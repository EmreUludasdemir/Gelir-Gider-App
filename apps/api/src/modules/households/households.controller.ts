import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { HouseholdsService } from './households.service';

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  async create(@User('id') userId: string, @Body('name') name: string) {
    return this.householdsService.create(userId, name);
  }

  @Get()
  async findAll(@User('id') userId: string) {
    return this.householdsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@User('id') userId: string, @Param('id') id: string) {
    return this.householdsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body('name') name: string
  ) {
    return this.householdsService.update(userId, id, name);
  }

  @Delete(':id')
  async remove(@User('id') userId: string, @Param('id') id: string) {
    return this.householdsService.remove(userId, id);
  }

  // Invites
  @Post(':id/invites')
  async createInvite(
    @User('id') userId: string,
    @Param('id') householdId: string,
    @Body('email') email?: string,
    @Body('role') role?: 'member' | 'viewer'
  ) {
    return this.householdsService.createInvite(userId, householdId, email, role);
  }

  @Post('join')
  async joinByCode(@User('id') userId: string, @Body('code') code: string) {
    return this.householdsService.joinByCode(userId, code);
  }

  @Delete(':id/leave')
  async leave(@User('id') userId: string, @Param('id') householdId: string) {
    return this.householdsService.leave(userId, householdId);
  }

  // Member management
  @Delete(':id/members/:memberId')
  async removeMember(
    @User('id') userId: string,
    @Param('id') householdId: string,
    @Param('memberId') memberId: string
  ) {
    return this.householdsService.removeMember(userId, householdId, memberId);
  }

  @Patch(':id/members/:memberId/role')
  async updateMemberRole(
    @User('id') userId: string,
    @Param('id') householdId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: string
  ) {
    return this.householdsService.updateMemberRole(userId, householdId, memberId, role);
  }

  // Shared budgets
  @Post(':id/budgets')
  async createSharedBudget(
    @User('id') userId: string,
    @Param('id') householdId: string,
    @Body() body: { categoryId: string; categoryLabel: string; limitAmount: number; period?: string }
  ) {
    return this.householdsService.createSharedBudget(userId, householdId, body);
  }

  @Get(':id/budgets')
  async getSharedBudgets(
    @User('id') userId: string,
    @Param('id') householdId: string
  ) {
    return this.householdsService.getSharedBudgets(userId, householdId);
  }

  @Delete(':id/budgets/:budgetId')
  async deleteSharedBudget(
    @User('id') userId: string,
    @Param('id') householdId: string,
    @Param('budgetId') budgetId: string
  ) {
    return this.householdsService.deleteSharedBudget(userId, householdId, budgetId);
  }
}
