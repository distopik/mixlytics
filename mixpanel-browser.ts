import { AnalyticsPlugin, Config, Identity, Event } from ".";
import get from "lodash/get";
import has from "lodash/has";
import isObject from "lodash/isObject";
import forEach from "lodash/forEach";

interface Mixpanel {
  track(action: string, options: any): void;

  identify(id: string): void;

  people: {
    set(props: any): void;
  };
}

/* maps between your own properties and mixpanel properties */
export interface MixpanelIdentityRebind {
  [propName: string]: "$first_name" | "$last_name" | "$created" | "$email" | string;
}

export default class MixpanelBrowser implements AnalyticsPlugin {
  private mixpanel?: Mixpanel;

  constructor(private identityRebind: MixpanelIdentityRebind = {}) {
  }

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    if (!this.mixpanel) {
      throw new Error("Not initialized");
    }

    if (event.verb === "identify") {
      const { identity } = event;
      this.mixpanel.identify(identity.id);

      const rebound: any = {};

      forEach(this.identityRebind, (id, name) => {
        if (has(identity, name)) {
          rebound[id] = get(identity, name);
        }
      });

      forEach(identity, (value, propName) => {
        if (!isObject(value) && !has(rebound, propName)) {
          rebound[propName] = value;
        }
      });

      this.mixpanel.people.set(rebound);
    } else if (event.verb === "track") {
      const { verb, action, ...restOfEvent } = event;
      this.mixpanel.track(action, restOfEvent);
    }
  }

  init() {
    if (!this.mixpanel) {
      this.mixpanel = (<any>window).mixpanel;
    }

    return !!this.mixpanel;
  }
}
