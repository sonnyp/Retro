#!/usr/bin/env -S gjs -m

import Gio from "gi://Gio";
import { programArgs, exit } from "system";

globalThis.__DEV__ = false;

const file = Gio.File.new_for_uri(import.meta.url);
const resource = Gio.resource_load(
  file
    .get_parent()
    .resolve_relative_path("re.sonny.Retro.src.gresource")
    .get_path()
);
Gio.resources_register(resource);

const module = await import("resource:///re/sonny/Retro/src/main.js");
const exit_code = await module.main(programArgs);
exit(exit_code);
