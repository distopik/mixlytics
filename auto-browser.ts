import GA from "./ga";
import Manager from "./index";
import SentryBrowser from "./sentry-browser";
import MixpanelBrowser from "./mixpanel-browser";
import AmplitudeBrowser from "./amplitude-browser";

type Env = Record<string, string>;

export default async function getInstance(): Promise<Manager> {
  const win: any = <any>window;
  const plugins = [];

  if (win.analytics) {
    return win.analytics;
  }

  if (win.ga) {
    plugins.push(new GA(win.gaMetricMap || {}, win.gaDimensionMap || {}));
  }
  if (win.Sentry) {
    plugins.push(new SentryBrowser());
  }
  if (win.mixpanel) {
    plugins.push(new MixpanelBrowser(win.mixpanelIdentityRebind || {}));
  }
  if (win.amplitude) {
    plugins.push(new AmplitudeBrowser());
  }

  const manager = new Manager();
  manager.addPlugins(...plugins);

  win.analytics = manager;

  return manager;
}

getInstance().catch(console.error);