import { AnalyticsPlugin, Event, Identity, Config } from "./index";

interface Scope {
  setUser(props: any): void;
}

interface Breadcrumb {
  category: string;
  message: string;
  level: string;
}

interface Sentry {
  configureScope(configurator: (scope: Scope) => void): void;

  addBreadcrumb(breadcrumb: Breadcrumb): void;

  init(opts: any): void;
}

export default class SentryBrowser implements AnalyticsPlugin {
  sentry?: Sentry;

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    if (!this.sentry) {
      throw new Error("Not initialized");
    }

    if (event.verb === "identify") {
      this.sentry.configureScope(scope => {
        scope.setUser(event.identity);
      });
    } else if (event.verb === "track") {
      const { verb, action, ...restOfEvent } = event;
      void verb;

      if (!restOfEvent.category) {
        restOfEvent.category = "general";
      }

      if (!restOfEvent.message) {
        restOfEvent.message = `${action}!`;
      }

      if (!restOfEvent.level) {
        restOfEvent.level = "info";
      }

      this.sentry.addBreadcrumb(<any>restOfEvent);
    }
  }

  init(cfg: Config) {
    if (!this.sentry) {
      this.sentry = (<any>window).Sentry;

      if (cfg.appId && cfg.appVersion && this.sentry) {
        this.sentry.init({
          release: `${cfg.appId}@${cfg.appVersion}`,
          environment: process.env.NODE_ENV
        });
      }
    }

    return !!this.sentry;
  }
}
