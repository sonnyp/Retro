#!/usr/bin/env -S gjs -m

import { programArgs, programInvocationName, exit } from "system";
import Gio from "gi://Gio";
import { build as gjspack } from "../troll/gjspack/src/gjspack.js";

globalThis.__DEV__ = true;

const { gresource_path, prefix } = gjspack({
  appid: "re.sonny.Retro",
  entry: Gio.File.new_for_path("./src/main.js"),
  output: Gio.File.new_for_path("/tmp"),
  // potfiles: Gio.File.new_for_paRetroApplicationth("./po/POTFILES"),
});
const resource = Gio.resource_load(gresource_path);
resource._register();

const module = await import(`resource://${prefix}/src/main.js`);
const exit_code = await module.main([programInvocationName, ...programArgs]);
exit(exit_code);
