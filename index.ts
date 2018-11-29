export interface Config {
  appName: string;
  appVersion?: string;
}

export type Verb = "identify" | "track" | "page";

export interface AnalyticsPlugin {
  init(cfg: Config): Promise<void>;

  execute(cfg: Config, identity: Identity | null, event: Event): void;
}

export interface Event {
  verb: Verb;
  [id: string]: any;
}

export interface Identity {
  id: string;
  email?: string;
}

export default class Manager {
  private plugins: AnalyticsPlugin[] = [];
  private initialized = false;
  private events: Event[] = [];
  private cfg: Config;
  private identity: Identity | null = null;

  constructor(appName: string) {
    this.cfg = { appName };
  }

  addPlugins(p: AnalyticsPlugin): void {
    this.plugins.push(p);
  }

  async init(cfg: Partial<Config> = {}) {
    this.cfg = { ...this.cfg, ...cfg };
    try {
      for (const c of this.plugins) {
        await c.init(this.cfg);
      }
    } finally {
      this.initialized = true;

      /* if any of them are identifies, send them first */
      for (const e of this.events) {
      }

      for (const e of this.events) {
        for (const c of this.plugins) {
          c.execute(this.cfg, this.identity, e);
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

  page(url: string | null = null) {
    this.push({ verb: "page", url });
  }

  track(event: string, config: Config) {
    this.push({ verb: "track", event, config });
  }

  identify(id: string, props: any = {}) {
    this.identity = { id, ...props };
    this.push({ verb: "identify", id, props });
  }
}
