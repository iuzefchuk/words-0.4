import { ObserverService } from '@/application/types/ports.ts';

// TODO check if this implementation is necessary
export default class MessageChannelObserverService implements ObserverService {
  private readonly channel = new MessageChannel();

  publish(value: number): void {
    this.channel.port2.postMessage(value);
  }

  subscribe(callback: (value: number) => void): void {
    this.channel.port1.onmessage = (event: MessageEvent<number>) => {
      callback(event.data);
    };
  }
}
