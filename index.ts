import { MixpanelIdentityRebind } from "./mixpanel-browser";
import { GaDimensionMap, GaMetricMap } from "./ga";

export interface Config {
  appId?: string;
  appName?: string;
  appVersion?: string;

  mixpanelIdentityRebind?: MixpanelIdentityRebind
  gaMetricMap?: GaMetricMap
  gaDimensionMap?: GaDimensionMap
}

export enum Verb {
  identify = "identify",
  track = "track",
  page = "page"
}

export interface AnalyticsPlugin {
  init(cfg: Config): boolean;

  execute(cfg: Config, identity: Identity | null, event: Event): void;
}

export interface IdentifyEvent {
  verb: "identify";
  identity: Identity;
}

interface TrackEventProps {
  category?: string;
  label?: string;
  value?: number;

  [id: string]: any;
}

export interface TrackEvent extends TrackEventProps {
  verb: "track";
  action: string;
}

export interface PageEvent {
  verb: "page";
  url: string;
  title: string;
}

export type Event = IdentifyEvent | TrackEvent | PageEvent;

export interface Identity {
  id: string;
  email?: string;

  [id: string]: any;
}

const MaxEvents = 10000;

class PluginState {
  initialized = false;

  constructor(private plugin: AnalyticsPlugin, private events: Event[] = []) {
  }

  push(cfg: Config, event: Event, identity: Identity | null) {
    if (this.tryInit(cfg)) {
      this.plugin.execute(cfg, identity, event);
    } else {
      this.events.push(event);
      while (this.events.length > MaxEvents) {
        this.events.shift();
      }
    }
  }

  tryInit(cfg: Config) {
    if (!this.initialized) {
      this.initialized = this.plugin.init(cfg);

      if (this.initialized) {
        let identify: Event | null = null;
        for (const e of this.events) {
          if (e.verb === "identify") {
            identify = e;
          }
        }

        if (identify) {
          this.plugin.execute(cfg, identify.identity, identify);
        }

        for (const e of this.events) {
          if (e.verb === "identify") {
            continue;
          }
          this.plugin.execute(cfg, identify ? identify.identity : null, e);
        }

        this.events = [];
      }
    }

    return this.initialized;
  }
}

export default class Manager {
  private plugins: PluginState[] = [];
  private initialized = false;
  private events: Event[] = [];
  private identity: Identity | null = null;

  constructor(private cfg: Config = {}) {
  }

  private tryInit = () => {
    let tryAgain = false;

    if (this.initialized) {
      for (const c of this.plugins) {
        if (!c.tryInit(this.cfg)) {
          tryAgain = true;
        }
      }
    } else {
      tryAgain = true;
    }

    if (tryAgain) {
      setTimeout(this.tryInit, 250);
    }
  };

  addPlugins(plugins: AnalyticsPlugin[]): void {
    this.plugins.push(...plugins.map(p => new PluginState(p)));
  }

  init(cfg: Config = {}) {
    this.cfg = { ...this.cfg, ...cfg };
    this.initialized = true; /* the caller is done with pushing plugins */

    for (const e of this.events) {
      for (const c of this.plugins) {
        c.push(cfg, e, this.identity);
      }
    }

    this.events = [];

    setTimeout(this.tryInit, 250);
  }

  push(e: Event) {
    if (this.initialized) {
      for (const c of this.plugins) {
        c.push(this.cfg, e, this.identity);
      }
    } else {
      this.events.push(e);
    }
  }

  page(url: string | null = null, title: string | null = null) {
    this.push({
      verb: "page",
      url: url || window.location.href,
      title: title || window.document.title
    });
  }

  track(event: string, props: TrackEventProps = {}) {
    this.push({ ...props, verb: "track", action: event });
  }

  identify(id: string, email: string, props: any = {}) {
    const identity = { id, email, ...props };
    this.identity = identity;
    this.push({ verb: "identify", identity });
  }
}
