import { Injectable, OnModuleInit } from '@nestjs/common';

interface HttpMetric {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsByEndpoint: Map<string, number>;
  requestsByStatusCode: Map<number, number>;
  errorsLast5Minutes: number;
}

interface SystemMetrics {
  uptime: number;
  nodeVersion: string;
  processId: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private httpMetrics: HttpMetric[] = [];
  private startTime: number;
  private initialCpuUsage: NodeJS.CpuUsage;
  private activeConnections = 0;
  private readonly MAX_METRICS_HISTORY = 10000;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  onModuleInit() {
    this.startTime = Date.now();
    this.initialCpuUsage = process.cpuUsage();

    // Cleanup old metrics periodically
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  recordHttpRequest(metric: HttpMetric) {
    this.httpMetrics.push(metric);

    // Keep only recent metrics
    if (this.httpMetrics.length > this.MAX_METRICS_HISTORY) {
      this.httpMetrics = this.httpMetrics.slice(-this.MAX_METRICS_HISTORY);
    }
  }

  incrementConnections() {
    this.activeConnections++;
  }

  decrementConnections() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  getApiMetrics(): ApiMetrics {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const durations = this.httpMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = this.httpMetrics.filter(m => m.statusCode < 400).length;
    const failCount = this.httpMetrics.filter(m => m.statusCode >= 400).length;
    const recentErrors = this.httpMetrics.filter(
      m => m.statusCode >= 500 && m.timestamp.getTime() > fiveMinutesAgo
    ).length;

    // Calculate percentiles
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    // Group by endpoint
    const byEndpoint = new Map<string, number>();
    const byStatusCode = new Map<number, number>();

    for (const metric of this.httpMetrics) {
      const key = `${metric.method} ${metric.route}`;
      byEndpoint.set(key, (byEndpoint.get(key) || 0) + 1);
      byStatusCode.set(metric.statusCode, (byStatusCode.get(metric.statusCode) || 0) + 1);
    }

    return {
      totalRequests: this.httpMetrics.length,
      successfulRequests: successCount,
      failedRequests: failCount,
      averageResponseTime: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      p50ResponseTime: durations[p50Index] || 0,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      requestsByEndpoint: byEndpoint,
      requestsByStatusCode: byStatusCode,
      errorsLast5Minutes: recentErrors,
    };
  }

  getSystemMetrics(): SystemMetrics {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      nodeVersion: process.version,
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(this.initialCpuUsage),
      activeConnections: this.activeConnections,
    };
  }

  /**
   * Group requests by method and status code for Prometheus labels
   */
  getRequestsByMethodAndStatus(): Map<string, number> {
    const result = new Map<string, number>();
    for (const metric of this.httpMetrics) {
      // Group status codes: 2xx, 3xx, 4xx, 5xx
      const statusGroup = Math.floor(metric.statusCode / 100) * 100;
      const key = `${metric.method}:${statusGroup}`;
      result.set(key, (result.get(key) || 0) + 1);
    }
    return result;
  }

  /**
   * Generate Prometheus-compatible metrics output
   */
  getPrometheusMetrics(): string {
    const api = this.getApiMetrics();
    const system = this.getSystemMetrics();

    const lines: string[] = [];

    // HTTP requests with method and status labels
    lines.push('# HELP http_requests_total Total number of HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    const requestsByMethodStatus = this.getRequestsByMethodAndStatus();
    for (const [key, count] of requestsByMethodStatus) {
      const [method, status] = key.split(':');
      lines.push(`http_requests_total{method="${method}",status="${status}"} ${count}`);
    }

    // HTTP request duration in seconds (Prometheus convention)
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE http_request_duration_seconds summary');
    lines.push(`http_request_duration_seconds{quantile="0.5"} ${(api.p50ResponseTime / 1000).toFixed(6)}`);
    lines.push(`http_request_duration_seconds{quantile="0.95"} ${(api.p95ResponseTime / 1000).toFixed(6)}`);
    lines.push(`http_request_duration_seconds{quantile="0.99"} ${(api.p99ResponseTime / 1000).toFixed(6)}`);
    lines.push(`http_request_duration_seconds_sum ${(api.averageResponseTime * api.totalRequests / 1000).toFixed(6)}`);
    lines.push(`http_request_duration_seconds_count ${api.totalRequests}`);

    lines.push('# HELP http_errors_last_5m HTTP errors in the last 5 minutes');
    lines.push('# TYPE http_errors_last_5m gauge');
    lines.push(`http_errors_last_5m ${api.errorsLast5Minutes}`);

    // System metrics
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${system.uptime}`);

    lines.push('# HELP process_memory_heap_used_bytes Heap memory used');
    lines.push('# TYPE process_memory_heap_used_bytes gauge');
    lines.push(`process_memory_heap_used_bytes ${system.memoryUsage.heapUsed}`);

    lines.push('# HELP process_memory_heap_total_bytes Total heap memory');
    lines.push('# TYPE process_memory_heap_total_bytes gauge');
    lines.push(`process_memory_heap_total_bytes ${system.memoryUsage.heapTotal}`);

    lines.push('# HELP process_memory_rss_bytes Resident set size');
    lines.push('# TYPE process_memory_rss_bytes gauge');
    lines.push(`process_memory_rss_bytes ${system.memoryUsage.rss}`);

    lines.push('# HELP process_cpu_user_seconds CPU time spent in user mode');
    lines.push('# TYPE process_cpu_user_seconds counter');
    lines.push(`process_cpu_user_seconds ${system.cpuUsage.user / 1000000}`);

    lines.push('# HELP process_cpu_system_seconds CPU time spent in system mode');
    lines.push('# TYPE process_cpu_system_seconds counter');
    lines.push(`process_cpu_system_seconds ${system.cpuUsage.system / 1000000}`);

    lines.push('# HELP active_connections Current number of active connections');
    lines.push('# TYPE active_connections gauge');
    lines.push(`active_connections ${system.activeConnections}`);

    // Request counts by status code
    lines.push('# HELP http_requests_by_status HTTP requests by status code');
    lines.push('# TYPE http_requests_by_status counter');
    for (const [code, count] of api.requestsByStatusCode) {
      lines.push(`http_requests_by_status{code="${code}"} ${count}`);
    }

    // Top endpoints
    lines.push('# HELP http_requests_by_endpoint HTTP requests by endpoint');
    lines.push('# TYPE http_requests_by_endpoint counter');
    const topEndpoints = [...api.requestsByEndpoint.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    for (const [endpoint, count] of topEndpoints) {
      const sanitized = endpoint.replace(/"/g, '\\"');
      lines.push(`http_requests_by_endpoint{endpoint="${sanitized}"} ${count}`);
    }

    return lines.join('\n');
  }

  private cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.httpMetrics = this.httpMetrics.filter(m => m.timestamp > oneHourAgo);
  }
}
