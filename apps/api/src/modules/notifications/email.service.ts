import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WeeklyReportData {
  userName: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topCategories: { name: string; amount: number }[];
  budgetAlerts: { category: string; percentage: number }[];
  savingsProgress: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@gelir-gider.app",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  async sendWeeklyReport(
    email: string,
    data: WeeklyReportData
  ): Promise<boolean> {
    const html = this.generateWeeklyReportHtml(data);
    return this.sendEmail({
      to: email,
      subject: `📊 Haftalık Finansal Raporunuz - ${new Date().toLocaleDateString(
        "tr-TR"
      )}`,
      html,
    });
  }

  async sendBudgetAlert(
    email: string,
    category: string,
    percentage: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 4px; }
          .header { color: #92400E; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="alert">
          <div class="header">⚠️ Bütçe Uyarısı</div>
          <p><strong>${category}</strong> kategorisinde bütçenizin <strong>%${percentage}</strong>'ini kullandınız.</p>
          <p>Harcamalarınızı kontrol etmek için uygulamaya giriş yapın.</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Gelir-Gider Takip Uygulaması
        </p>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `⚠️ Bütçe Uyarısı: ${category}`,
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          .header { color: #8B5CF6; font-size: 24px; font-weight: bold; text-align: center; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">🎉 Hoş Geldiniz!</div>
          <p>Merhaba ${name},</p>
          <p>Gelir-Gider Takip uygulamasına hoş geldiniz! Artık finanslarınızı kolayca yönetebilirsiniz.</p>
          <ul>
            <li>📊 Harcamalarınızı takip edin</li>
            <li>🎯 Bütçe hedefleri belirleyin</li>
            <li>📈 Tasarruf hedeflerinizi izleyin</li>
            <li>🤖 AI destekli analiz alın</li>
          </ul>
          <p style="text-align: center; margin-top: 30px;">
            <a href="${
              process.env.APP_URL || "http://localhost:3000"
            }/dashboard" class="button">
              Dashboard'a Git
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "🎉 Gelir-Gider Takip Uygulamasına Hoş Geldiniz!",
      html,
    });
  }

  private generateWeeklyReportHtml(data: WeeklyReportData): string {
    const topCategoriesHtml = data.topCategories
      .map((c) => `<li>${c.name}: ₺${c.amount.toLocaleString("tr-TR")}</li>`)
      .join("");

    const alertsHtml =
      data.budgetAlerts.length > 0
        ? data.budgetAlerts
            .map(
              (a) =>
                `<li style="color: ${
                  a.percentage >= 100 ? "#EF4444" : "#F59E0B"
                }">
            ${a.category}: %${a.percentage}
          </li>`
            )
            .join("")
        : '<li style="color: #10B981">Tüm bütçeler kontrol altında ✓</li>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
          .header { color: #1a1a1a; font-size: 24px; font-weight: bold; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px; }
          .stat-grid { display: flex; gap: 15px; margin: 20px 0; }
          .stat-card { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
          .income { background: #D1FAE5; color: #065F46; }
          .expense { background: #FEE2E2; color: #991B1B; }
          .balance { background: #E0E7FF; color: #3730A3; }
          .stat-value { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 12px; margin-top: 5px; }
          .section { margin-top: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 10px; }
          .progress-bar { background: #E5E7EB; border-radius: 4px; height: 20px; overflow: hidden; }
          .progress-fill { background: #8B5CF6; height: 100%; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">📊 Haftalık Finansal Rapor</div>
          <p>Merhaba ${data.userName},</p>
          <p>İşte bu haftanın finansal özetiniz:</p>
          
          <div class="stat-grid">
            <div class="stat-card income">
              <div class="stat-value">₺${data.totalIncome.toLocaleString(
                "tr-TR"
              )}</div>
              <div class="stat-label">Toplam Gelir</div>
            </div>
            <div class="stat-card expense">
              <div class="stat-value">₺${data.totalExpense.toLocaleString(
                "tr-TR"
              )}</div>
              <div class="stat-label">Toplam Gider</div>
            </div>
            <div class="stat-card balance">
              <div class="stat-value">₺${data.balance.toLocaleString(
                "tr-TR"
              )}</div>
              <div class="stat-label">Net Bakiye</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🏆 En Çok Harcama Yapılan Kategoriler</div>
            <ul>${topCategoriesHtml}</ul>
          </div>

          <div class="section">
            <div class="section-title">⚠️ Bütçe Durumu</div>
            <ul>${alertsHtml}</ul>
          </div>

          <div class="section">
            <div class="section-title">🎯 Tasarruf İlerlemesi</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(
                data.savingsProgress,
                100
              )}%"></div>
            </div>
            <p style="text-align: center; margin-top: 5px;">%${
              data.savingsProgress
            } tamamlandı</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
            Bu rapor otomatik olarak oluşturulmuştur.<br>
            Gelir-Gider Takip Uygulaması
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
