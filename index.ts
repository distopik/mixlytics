export interface Config {
  appId?: string;
  appName?: string;
  appVersion?: string;
}

export type Verb = "identify" | "track" | "page";

export interface AnalyticsPlugin {
  init(cfg: Config): Promise<void>;

  execute(cfg: Config, identity: Identity | null, event: Event): void;
}

export interface IdentifyEvent {
  verb: "identify";
  identity: Identity;
}

export interface TrackEvent {
  verb: "track";
  action: string;
  category?: string;
  label?: string;
  value?: number;

  [id: string]: any;
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

export default class Manager {
  private plugins: AnalyticsPlugin[] = [];
  private initialized = false;
  private events: Event[] = [];
  private cfg: Config = {};
  private identity: Identity | null = null;

  addPlugins(...p: AnalyticsPlugin[]): void {
    this.plugins.push(...p);
  }

  async init(cfg: Config = {}) {
    this.cfg = { ...this.cfg, ...cfg };

    try {
      for (const c of this.plugins) {
        await c.init(this.cfg);
      }
    } catch (e) {
      console.error("while booting up analytics", e);
    } finally {
      this.initialized = true;

      /* if any of them are identifies, send them first */
      let lastIdentify: IdentifyEvent | null = null;
      for (const e of this.events) {
        if (e.verb === "identify") {
          lastIdentify = e;
        }
      }

      if (lastIdentify) {
        for (const c of this.plugins) {
          c.execute(this.cfg, this.identity, lastIdentify);
        }
      }

      for (const e of this.events) {
        if (e.verb !== "identify") {
          for (const c of this.plugins) {
            c.execute(this.cfg, this.identity, e);
          }
        }
      }

      this.events = [];
    }
  }

  push(e: Event) {
    if (this.initialized) {
      for (const c of this.plugins) {
        c.execute(this.cfg, this.identity, e);
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

  track(event: string, props: object = {}) {
    this.push({ verb: "track", action: event, ...props });
  }

  identify(id: string, email: string, props: any = {}) {
    const identity = { id, email, ...props };
    this.identity = identity;
    this.push({ verb: "identify", identity });
  }
}
