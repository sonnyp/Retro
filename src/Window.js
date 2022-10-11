import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Adw from "gi://Adw";
import Template from "./window.blp" assert { type: "uri" };

class RetroWindow extends Adw.ApplicationWindow {
  constructor(application) {
    super({ application });

    this.updateTime();
    GLib.timeout_add_seconds(GLib.PRIORITY_HIGH, 1, () => {
      this.updateTime();
      return GLib.SOURCE_CONTINUE;
    });
  }

  updateTime() {
    const datetime = GLib.DateTime.new_from_unix_local(
      GLib.get_real_time() / 1000000
    );
    this._foreground.label = datetime.format("%T");
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
