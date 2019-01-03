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
}

export default class SentryBrowser implements AnalyticsPlugin {
  sentry: Sentry;

  constructor() {
    this.sentry = (<any>window).Sentry;
  }

  execute(cfg: Config, identity: Identity | null, event: Event): void {
    if (event.verb === "identify") {
      this.sentry.configureScope(scope => {
        scope.setUser(event.identity);
      });
    } else if (event.verb === "track") {
      const { verb, action, ...restOfEvent } = event;

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

  async init(cfg: Config): Promise<void> {
    return undefined;
  }
}
