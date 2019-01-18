import { AnalyticsPlugin, Config, Identity, Event } from "./index";

type IntercomVerb = "trackEvent";
type Intercom = (verb: IntercomVerb, ...data: any) => void;

export default class IntercomBrowser implements AnalyticsPlugin {
  intercom: Intercom = null as any;

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    if (event.verb === "track") {
      /* identify */
      const { action, verb, ...rest } = event;
      this.intercom("trackEvent", action, rest);
    } else if (event.verb === "identify") {
      const { verb, ...rest } = event;
      for (const name in rest.identity) {
        (<any>window).intercomSettings[name] = rest.identity[name];
      }
    }
  }

  init(cfg: Config) {
    if (!this.intercom) {
      this.intercom = (<any>window).Intercom;
    }

    return !!this.intercom;
  }
}
