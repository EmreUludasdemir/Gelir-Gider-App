import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService, PlanFeatures } from './billing.service';

export const REQUIRED_FEATURE_KEY = 'requiredFeature';
export const RequireFeature = (feature: keyof PlanFeatures) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);

export const REQUIRED_PLAN_KEY = 'requiredPlan';
export const RequirePlan = (...plans: string[]) =>
  SetMetadata(REQUIRED_PLAN_KEY, plans);

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<keyof PlanFeatures>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true; // No feature requirement
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const hasAccess = await this.billingService.checkFeatureAccess(userId, requiredFeature);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Bu özellik için üst plan gerekli. Lütfen planınızı yükseltin.`,
      );
    }

    return true;
  }
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const userPlan = await this.billingService.getUserPlan(userId);

    if (!requiredPlans.includes(userPlan.planName)) {
      throw new ForbiddenException(
        `Bu özellik ${requiredPlans.join(' veya ')} planı gerektirir.`,
      );
    }

    return true;
  }
}

@Injectable()
export class TransactionLimitGuard implements CanActivate {
  constructor(private billingService: BillingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const { allowed, remaining } = await this.billingService.checkTransactionLimit(userId);

    if (!allowed) {
      throw new ForbiddenException(
        `İşlem limitinize ulaştınız. Daha fazla işlem eklemek için planınızı yükseltin.`,
      );
    }

    // Attach remaining to request for potential use in controller
    request.transactionLimitRemaining = remaining;

    return true;
  }
}
