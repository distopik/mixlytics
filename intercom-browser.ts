import { AnalyticsPlugin, Config, Identity, Event } from "./index";

type IntercomVerb = "trackEvent";
type Intercom = (verb: IntercomVerb, ...data: any) => void;

export default class IntercomBrowser implements AnalyticsPlugin {
  intercom: Intercom = null as any;

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    const anyWindow = window as any;

    if (event.verb === "track") {
      /* identify */
      const { action, verb, ...rest } = event;
      this.intercom("trackEvent", action, rest);
    } else if (event.verb === "identify") {
      const { id, email, ...rest } = event.identity;
      if (anyWindow.intercomSettings) {
        anyWindow.intercomSettings = { ...anyWindow.intercomSettings, email, user_id: id, ...rest };
      }
    }
  }

  init(cfg: Config) {
    const anyWindow = window as any;

    if (!this.intercom) {
      this.intercom = anyWindow.Intercom;

      if (anyWindow.intercomSettings) {
        if (cfg.appId) {
          anyWindow.intercomSettings.applicationId = cfg.appId;
        }
        if (cfg.appVersion) {
          anyWindow.intercomSettings.applicationVersion = cfg.appVersion;
        }
      }
    }

    return !!this.intercom;
  }
}
