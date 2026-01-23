import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Admin yetkisi kontrol endpoint'i
   */
  @Get('verify')
  async verifyAdmin(@User('id') userId: string) {
    const isAdmin = await this.adminService.isAdmin(userId);
    return { isAdmin };
  }

  /**
   * Dashboard istatistikleri
   */
  @Get('stats')
  async getDashboardStats(@User('id') userId: string) {
    await this.adminService.verifyAdmin(userId);
    return this.adminService.getDashboardStats();
  }

  /**
   * Kullanıcı listesi
   */
  @Get('users')
  async getUsers(
    @User('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    await this.adminService.verifyAdmin(userId);
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  /**
   * Abonelik listesi
   */
  @Get('subscriptions')
  async getSubscriptions(
    @User('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    await this.adminService.verifyAdmin(userId);
    return this.adminService.getSubscriptions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  /**
   * Son ödemeler
   */
  @Get('payments')
  async getRecentPayments(
    @User('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    await this.adminService.verifyAdmin(userId);
    return this.adminService.getRecentPayments(limit ? parseInt(limit) : 10);
  }
}
