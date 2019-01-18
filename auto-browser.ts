import GA from "./ga";
import Manager, { AnalyticsPlugin, Config } from "./index";
import SentryBrowser from "./sentry-browser";
import MixpanelBrowser from "./mixpanel-browser";
import AmplitudeBrowser from "./amplitude-browser";
import IntercomBrowser from "./intercom-browser";

export default function getInstance(cfg: Config = {}): Manager {
  const win: any = <any>window;
  if (!win.analytics) {

    const manager = new Manager();
    win.analytics = manager;

    const plugins: AnalyticsPlugin[] = [];

    plugins.push(new GA(cfg.gaMetricMap || {}, cfg.gaDimensionMap || {}));
    plugins.push(new SentryBrowser());
    plugins.push(new MixpanelBrowser(cfg.mixpanelIdentityRebind || {}));
    plugins.push(new AmplitudeBrowser());
    plugins.push(new IntercomBrowser());

    manager.addPlugins(plugins);
    manager.init(cfg);
  }

  return win.analytics;
}

declare global {
  interface Window {
    analytics: Manager;
  }
}
