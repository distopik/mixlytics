import { AnalyticsPlugin } from ".";
import { Config, Event, Identity } from "./index";

export type GARange = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20

/* maps property name to custom metric number */
export interface MetricMap {
  [propName: string]: GARange;
}

/* maps property name to custom dimension number */
export interface DimensionMap {
  [propName: string]: GARange;
}

type GoogleAnalytics = Function;

export default class GA implements AnalyticsPlugin {
  private readonly ga: GoogleAnalytics;

  constructor(private metricMap: MetricMap = {}, private dimensionMap: DimensionMap = {}) {
    this.ga = (<any>window).ga;
  }

  async init(cfg: Config): Promise<void> {
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

  execute(cfg: Config, _: Identity | null, event: Event): void {
    /* we purposefully ignore page events */
    if (event.verb === "identify") {
      const { identity } = event;

      for (const name in this.dimensionMap) {
        if (identity[name] != undefined) {
          this.ga("set", `dimension${this.dimensionMap[name]}`, identity[name]);
        }
      }
    } else if (event.verb === "track") {
      for (const name in this.metricMap) {
        if (event[name] != undefined) {
          this.ga("set", `metric${this.metricMap[name]}`, event[name]);
        }
      }

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
}
