#!/usr/bin/env -S gjs -m

import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { programInvocationName, exit } from "system";

globalThis.__DEV__ = false;

const file = Gio.File.new_for_uri(import.meta.url);
const resource = Gio.resource_load(
  file
    .get_parent()
    .resolve_relative_path("re.sonny.Retro.src.gresource")
    .get_path()
);
Gio.resources_register(resource);

const loop = new GLib.MainLoop(null, false);
import("resource:///re/sonny/Retro/src/main.js")
  .then((module) => {
    // Workaround for issue
    // https://gitlab.gnome.org/GNOME/gjs/-/issues/468
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      loop.quit();
      const exit_code = module.main([programInvocationName, ...ARGV]);
      // const exit_code = imports.package.run(main);
      exit(exit_code);
      return GLib.SOURCE_REMOVE;
    });
  })
  .catch(logError);
loop.run();
