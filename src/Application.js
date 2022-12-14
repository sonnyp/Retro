import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import { gettext as _ } from "gettext";

import Window from "./Window.js";

class RetroApplication extends Adw.Application {
  constructor() {
    super({
      application_id: "re.sonny.Retro",
      flags: Gio.ApplicationFlags.FLAGS_NONE,
      resource_base_path: "/re/sonny/Retro/src",
    });

    const action_quit = new Gio.SimpleAction({ name: "quit" });
    action_quit.connect("activate", (action) => {
      this.quit();
    });
    this.add_action(action_quit);
    this.set_accels_for_action("app.quit", ["<Ctrl>Q"]);

    const action_about = new Gio.SimpleAction({ name: "about" });
    action_about.connect("activate", (action) => {
      const about_window = new Adw.AboutWindow({
        developer_name: "Sonny Piers",
        copyright: "Copyright 2022 Sonny Piers",
        license_type: Gtk.License.GPL_3_0_ONLY,
        application_name: "Retro",
        application_icon: "re.sonny.Retro",
        website: "https://retro.sonny.re",
        issue_url: "https://github.com/sonnyp/Retro/issues",
        transient_for: this.active_window,
        modal: true,
        // TRANSLATORS: eg. 'Translator Name <your.email@domain.com>' or 'Translator Name https://website.example'
        translator_credits: _("translator-credits"),
        developers: ["Sonny Piers https://sonny.re"],
      });
      about_window.present();
    });
    this.add_action(action_about);
  }

  vfunc_activate() {
    let { active_window } = this;

    if (!active_window) active_window = new Window(this);

    active_window.present();
  }
}

export default GObject.registerClass(RetroApplication);
