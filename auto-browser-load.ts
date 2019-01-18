import getInstance from "./auto-browser";

const winAny = <any>window;
getInstance(winAny.analyticsConfig || {});
