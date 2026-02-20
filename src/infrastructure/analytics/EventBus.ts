export type AnalyticsEventName =
  | 'session_started'
  | 'card_viewed'
  | 'card_favorited'
  | 'card_skipped'
  | 'phase_changed'
  | 'session_completed';

export type AnalyticsEvent<T = Record<string, unknown>> = {
  name: AnalyticsEventName;
  payload: T;
  timestamp: number;
};

type Handler = (event: AnalyticsEvent) => void;

export class EventBus {
  private handlers = new Set<Handler>();
  private events: AnalyticsEvent[] = [];

  public emit<T extends Record<string, unknown>>(name: AnalyticsEventName, payload: T): void {
    const event: AnalyticsEvent<T> = { name, payload, timestamp: Date.now() };
    this.events.push(event);
    this.handlers.forEach((handler) => handler(event));
  }

  public subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public getHistory(): AnalyticsEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
  }
}
