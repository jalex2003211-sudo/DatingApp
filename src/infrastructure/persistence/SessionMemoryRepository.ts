import { SessionSummary } from '../../domain/session/types';

export class SessionMemoryRepository {
  private latestSummary: SessionSummary | null = null;

  public saveSummary(summary: SessionSummary): void {
    this.latestSummary = summary;
  }

  public getLatestSummary(): SessionSummary | null {
    return this.latestSummary;
  }

  public reset(): void {
    this.latestSummary = null;
  }
}
