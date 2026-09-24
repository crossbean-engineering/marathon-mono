import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { StatsType } from '@marathon/core';
import { UserStatsUseCase } from './UserStatsUseCase';
import { ParticipantStatsUseCase } from './ParticipantStatsUseCase';
import { WristbandStatsUseCase } from './WristbandStatsUseCase';
import { FinancialStatsUseCase } from './FinancialStatsUseCase';

@Injectable()
export class StatsFactory {
  constructor(
    private userStatsUseCase: UserStatsUseCase,
    private participantStatsUseCase: ParticipantStatsUseCase,
    private wristbandStatsUseCase: WristbandStatsUseCase,
    private financialStatsUseCase: FinancialStatsUseCase,
  ) {}

  getStatsUseCase(type: StatsType) {
    switch (type) {
      case 'user_stats':
        return this.userStatsUseCase;
      case 'participant_stats':
        return this.participantStatsUseCase;
      case 'wristband_stats':
        return this.wristbandStatsUseCase;
      case 'financial_stats':
        return this.financialStatsUseCase;
      default:
        throw new NotFoundException(`Stats type '${type}' not found`);
    }
  }
}
