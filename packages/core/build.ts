import path from "path";
import type { Location } from "history";
import type { ComponentType } from "react";
import type { Params } from "react-router";

import type { RemixConfig } from "./config";
import type { EntryContext, RouteData } from "./entry";
import type { Request, Response } from "./platform";

export type BuildManifest = Record<string, BuildChunk>;

export interface BuildChunk {
  fileName: string;
  imports: string[];
}

export const ManifestServerEntryKey = "__entry_server__";

export function getBuildManifest(serverBuildDirectory: string): BuildManifest {
  let manifestFile = path.join(serverBuildDirectory, "manifest.json");
  return require(manifestFile);
}

export interface ServerEntryModule {
  default(
    request: Request,
    responseStatusCode: number,
    context: EntryContext
  ): Promise<Response>;
}

export function getServerEntryModule(
  serverBuildDirectory: string,
  manifest: BuildManifest
): ServerEntryModule {
  let requirePath = path.join(
    serverBuildDirectory,
    manifest[ManifestServerEntryKey].fileName
  );

  return require(requirePath);
}

interface MetaArgs {
  data: RouteData[string];
  params: Params;
  location: Location;
  allData: { [routeId: string]: RouteData[string] };
}

interface MetaContents {
  [name: string]: string;
}

export interface RouteModules {
  [routeId: string]: RouteModule;
}

export interface RouteModule {
  default: ComponentType;
  meta?(metaArgs: MetaArgs): MetaContents;
}

export function getRouteModules(
  serverBuildDirectory: string,
  routes: RemixConfig["routes"],
  manifest: BuildManifest,
  modules: RouteModules = {}
): RouteModules {
  for (let route of routes) {
    let requirePath = path.join(
      serverBuildDirectory,
      manifest[route.id].fileName
    );

    modules[route.id] = require(requirePath);

    if (route.children) {
      getRouteModules(serverBuildDirectory, route.children, manifest, modules);
    }
  }

  return modules;
}