import Gio from "gi://Gio";
import GLib from "gi://GLib";

import "gi://Gtk?version=4.0";
import "gi://Adw?version=1";

import RetroApplication from "./Application.js";

import "./style.css";

export function main(argv) {
  const application = new RetroApplication();

  if (__DEV__) {
    const restart = new Gio.SimpleAction({
      name: "restart",
      parameter_type: null,
    });
    restart.connect("activate", () => {
      application.quit();
      GLib.spawn_async(null, argv, null, GLib.SpawnFlags.DEFAULT, null);
    });
    application.add_action(restart);
    application.set_accels_for_action("app.restart", ["<Control><Shift>Q"]);
  }

  return application.run(argv);
}
