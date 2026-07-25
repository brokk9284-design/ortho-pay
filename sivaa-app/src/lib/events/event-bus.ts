import type { EventType, AppEvent } from "@/types";

type EventHandler = (event: AppEvent) => Promise<void>;

const handlers = new Map<EventType, EventHandler[]>();

export function subscribe(eventType: EventType, handler: EventHandler): void {
  const existing = handlers.get(eventType) || [];
  handlers.set(eventType, [...existing, handler]);
}

export function unsubscribe(eventType: EventType, handler: EventHandler): void {
  const existing = handlers.get(eventType);
  if (!existing) return;
  handlers.set(
    eventType,
    existing.filter((h) => h !== handler)
  );
}

export async function publish(
  eventType: EventType,
  payload: Record<string, unknown>,
  actorId?: string
): Promise<void> {
  const event: AppEvent = {
    id: crypto.randomUUID(),
    type: eventType,
    payload,
    actor_id: actorId || null,
    created_at: new Date().toISOString(),
  };

  const eventHandlers = handlers.get(eventType) || [];
  const errors: Error[] = [];

  await Promise.allSettled(
    eventHandlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (err) {
        errors.push(err as Error);
        console.error(`[event-bus] Handler failed for ${eventType}:`, err);
      }
    })
  );

  if (errors.length > 0) {
    console.error(`[event-bus] ${errors.length} handler(s) failed for event ${eventType}`);
  }
}

export function clearHandlers(): void {
  handlers.clear();
}

export function getRegisteredEventTypes(): EventType[] {
  return Array.from(handlers.keys());
}
