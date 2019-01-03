import { AnalyticsPlugin, Event, Identity, Config } from "./index";

interface Amplitude {
  setUserId(id: string): void;

  setUserProperties(props: any): void;

  logEvent(action: string, props: any): void;
}

export default class AmplitudeBrowser implements AnalyticsPlugin {
  amplitude: Amplitude;

  constructor() {
    this.amplitude = (<any>window).amplitude.getInstance();
  }

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    if (event.verb === "identify") {
      const { id, ...withoutId } = event.identity;
      this.amplitude.setUserId(id);
      this.amplitude.setUserProperties(withoutId);
    } else if (event.verb === "track") {
      const { verb, action, ...restOfEvent } = event;
      this.amplitude.logEvent(action, restOfEvent);
    }
  }

  async init(cfg: Config): Promise<void> {}
}
