import { AnalyticsPlugin, Config, Identity, Event } from ".";

interface Mixpanel {
  track(action: string, options: any): void;

  identify(id: string): void;

  people: {
    set(props: any): void;
  };
}

/* maps between your own properties and mixpanel properties */
export interface IdentityRebind {
  [propName: string]: "$first_name" | "$last_name" | "$created" | "$email" | string;
}

export default class MixpanelBrowser implements AnalyticsPlugin {
  private mixpanel: Mixpanel;

  constructor(private identityRebind: IdentityRebind = {}) {
    this.mixpanel = (<any>window).mixpanel;
  }

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    if (event.verb === "identify") {
      const { identity } = event;
      this.mixpanel.identify(identity.id);

      const rebound: any = {};
      const reboundNames = [];
      for (const name in this.identityRebind) {
        if (identity[name] != undefined) {
          rebound[this.identityRebind[name]] = identity[name];
          reboundNames.push(name);
        }
      }

      const { verb, ...restOfEvent } = event;
      for (const name in restOfEvent) {
        if (reboundNames.indexOf(name) < 0) {
          rebound[name] = (<any>restOfEvent)[name];
        }
      }

      this.mixpanel.people.set(rebound);
    } else if (event.verb === "track") {
      const { verb, action, ...restOfEvent } = event;
      this.mixpanel.track(action, restOfEvent);
    }
  }

  async init(cfg: Config): Promise<void> {}
}
