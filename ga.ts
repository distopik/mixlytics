import { AnalyticsPlugin } from ".";
import { Config, Event, Identity } from "./index";
import get from "lodash/get";
import has from "lodash/has";
import forEach from "lodash/forEach";

export type GARange = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

/* maps property name to custom metric number */
export interface GaMetricMap {
  [propName: string]: GARange;
}

/* maps property name to custom dimension number */
export interface GaDimensionMap {
  [propName: string]: GARange;
}

type GoogleAnalytics = Function;

export default class GA implements AnalyticsPlugin {
  private ga?: GoogleAnalytics;

  constructor(private metricMap: GaMetricMap = {}, private dimensionMap: GaDimensionMap = {}) {
  }

  execute(cfg: Config, id: Identity | null, event: Event): void {
    if (!this.ga) {
      throw new Error("Not Initialized");
    }

    if (id) {
      this.ga("set", { userId: id.id });
    }

    if (event.verb === "identify") {
      const { identity } = event;

      forEach(this.dimensionMap, (id, name) => {
        if (this.ga && has(identity, name)) {
          this.ga("set", `dimension${id}`, get(identity, name));
        }
      });
    } else if (event.verb === "track") {
      forEach(this.dimensionMap, (id, name) => {
        if (this.ga && has(event, name)) {
          this.ga("set", `metric${id}`, get(event, name));
        }
      });

      const toSend: any = { eventAction: event.action };
      if (event.category) {
        toSend.eventCategory = event.category;
      }
      if (event.label) {
        toSend.eventLabel = event.label;
      }
      if (event.value) {
        toSend.eventValue = event.value;
      }

      this.ga("send", toSend);
    }
  }

  init(cfg: Config) {
    if (!this.ga) {
      this.ga = (<any>window).ga;

      if (this.ga) {
        if (cfg.appName) {
          this.ga("set", "appName", cfg.appName);
        }
        if (cfg.appVersion) {
          this.ga("set", "appVersion", cfg.appVersion);
        }
        if (cfg.appId) {
          this.ga("set", "appId", cfg.appId);
        }
      }
    }

    return !!this.ga;
  }
}
