/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/phaser/typescript/phaser.d.ts" />

declare var firebase: any;

interface FirebaseSnapshot {
  key: string;
  val(): any;
}

// Type declarations for Webpack runtime
// https://github.com/defaude/awesome-typescript-loader/blob/64a7ff77747c3dd452d3362c03a2965a11dc63ed/lib/runtime.d.ts
interface WebpackRequire {
  (id: string): any;
  (paths: string[], callback: (...modules: any[]) => void): void;
  context(directory: string, useSubDirectories?: boolean, regExp?: RegExp): WebpackContext;
  ensure(ids: string[], callback: WebpackRequireEnsureCallback, chunkName?: string): void;
}

interface WebpackContext extends WebpackRequire {
  keys(): string[];
}

interface WebpackRequireEnsureCallback {
  (req: WebpackRequire): void;
}

interface WebpackRequireImageDictionary {
  [key: string]: string;
}

declare var require: WebpackRequire;
