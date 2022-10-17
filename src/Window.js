import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Template from "./window.blp" assert { type: "uri" };
import Gtk from "gi://Gtk";

const settings = new Gio.Settings({
  schema_id: "re.sonny.Retro",
  path: "/re/sonny/Retro/",
});

let window_editor;

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

    this.load();

    const action_customize = new Gio.SimpleAction({ name: "customize" });
    action_customize.connect("activate", async (action) => {
      const { default_style, file, updateStyle } = this;
      if (!window_editor) {
        const { default: Editor } = await import("./Editor.js");
        window_editor = new Editor({
          application,
          default_style,
          file,
          text: this.style || "",
          onChange: updateStyle,
        });
      }
      window_editor.present();
    });
    this.add_action(action_customize);
  }

  load() {
    this.default_style = new TextDecoder("utf8").decode(
      Gio.resources_lookup_data(
        "/re/sonny/Retro/src/style.css",
        Gio.ResourceLookupFlags.NONE
      ).toArray()
    );

    const file = Gio.File.new_for_path(
      GLib.build_filenamev([createDataDir(), "style.css"])
    );
    this.file = file;

    try {
      const [, contents] = file.load_contents(null);
      this.updateStyle(new TextDecoder().decode(contents));
    } catch (err) {
      if (err.code !== Gio.IOErrorEnum.NOT_FOUND) {
        throw err;
      }
      this.updateStyle(this.default_style);
    }
  }

  updateStyle = (text) => {
    this.style = text;
    if (this.css_provider) {
      Gtk.StyleContext.remove_provider_for_display(
        this.get_display(),
        this.css_provider
      );
      this.css_provider = null;
    }

    const css_provider = new Gtk.CssProvider();
    if (window_editor) {
      window_editor?.onCssProvider(css_provider);
    }
    if (text) {
      css_provider.load_from_data(text);
    }
    Gtk.StyleContext.add_provider_for_display(
      this.get_display(),
      css_provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
    this.css_provider = css_provider;
  };

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

function createDataDir() {
  const data_dir = GLib.build_filenamev([
    GLib.get_user_data_dir(),
    "re.sonny.Retro",
  ]);

  try {
    Gio.File.new_for_path(data_dir).make_directory(null);
  } catch (err) {
    if (err.code !== Gio.IOErrorEnum.EXISTS) {
      throw err;
    }
  }

  return data_dir;
}
