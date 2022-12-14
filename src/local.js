#!/usr/bin/env -S gjs -m

import { programInvocationName, exit } from "system";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import { build as gjspack } from "../troll/gjspack/src/gjspack.js";

globalThis.__DEV__ = true;

const { gresource_path, prefix } = gjspack({
  appid: "re.sonny.Retro",
  entry: Gio.File.new_for_path("./src/main.js"),
  output: Gio.File.new_for_path("/tmp"),
  // potfiles: Gio.File.new_for_path("./po/POTFILES"),
});
const resource = Gio.resource_load(gresource_path);
Gio.resources_register(resource);

const loop = new GLib.MainLoop(null, false);
import(`resource://${prefix}/src/main.js`)
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
