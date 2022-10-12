import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Template from "./window.blp" assert { type: "uri" };

const settings = new Gio.Settings({
  schema_id: "re.sonny.Retro",
  path: "/re/sonny/Retro/",
});

class RetroWindow extends Adw.ApplicationWindow {
  constructor(application) {
    super({ application });

    this.update();
    GLib.timeout_add_seconds(GLib.PRIORITY_HIGH, 1, () => {
      this.updateTime();
      return GLib.SOURCE_CONTINUE;
    });

    const display_seconds = settings.create_action("display-seconds");
    this.add_action(display_seconds);

    settings.connect("changed", (sef, key) => {
      if (key !== "display-seconds") return;
      this.update();
    });
  }

  update() {
    if (settings.get_boolean("display-seconds")) {
      this._background.label = "88:88:88";
    } else {
      this._background.label = "88:88";
    }

    this.updateTime();
  }

  updateTime() {
    const datetime = GLib.DateTime.new_from_unix_local(
      GLib.get_real_time() / 1000000
    );

    if (settings.get_boolean("display-seconds")) {
      this._foreground.label = datetime.format("%T");
    } else {
      this._foreground.label = datetime.format("%R");
    }
  }
}

export default GObject.registerClass(
  {
    GTypeName: "RetroWindow",
    Template,
    InternalChildren: ["background", "foreground"],
  },
  RetroWindow
);
