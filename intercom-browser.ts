import { AnalyticsPlugin, Config, Identity, Event } from ".";

type IntercomVerb = "trackEvent"
type Intercom = (verb: IntercomVerb, ...data: any) => void

export default class IntercomBrowser implements AnalyticsPlugin {
  intercom: Intercom;

  constructor() {
    this.intercom = (<any>window).Intercom;
    if (!(<any>window).intercomSettings) {
      (<any>window).intercomSettings = {};
    }
  }

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    if (event.verb === "track") {
      /* identify */
      const { action, verb, ...rest } = event;
      this.intercom("trackEvent", action, rest);
    } else if (event.verb === "identify") {
      const { verb, ...rest } = event;
      for (const name in rest.identity) {
        ((<any>window).intercomSettings)[name] = rest.identity[name];
      }
    }
  }

  async init(cfg: Config): Promise<void> {
  }
}
