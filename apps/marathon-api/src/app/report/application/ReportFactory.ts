import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { ReportType } from '@marathon/core';
import { PackagePerformanceUseCase } from './PackagePerformanceUseCase';

@Injectable()
export class ReportFactory {
  constructor(private packagePerformanceUseCase: PackagePerformanceUseCase) {}

  getReportUseCase(reportType: ReportType) {
    switch (reportType) {
      case 'package_performance':
        return this.packagePerformanceUseCase;
      default:
        throw new NotFoundException(`Report type '${reportType}' not found`);
    }
  }
}
