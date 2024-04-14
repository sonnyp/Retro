import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Template from "./window.blp" assert { type: "uri" };
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

const settings = new Gio.Settings({
  schema_id: "re.sonny.Retro",
  path: "/re/sonny/Retro/",
});

let window_editor;

class RetroWindow extends Adw.ApplicationWindow {
  source_id = null;

  constructor(application) {
    super({ application });
    this.bind_state();

    const display_seconds = settings.create_action("display-seconds");
    this.add_action(display_seconds);

    settings.connect("changed", (sef, key) => {
      if (key !== "display-seconds") return;
      this.update();
    });
    this.update();

    this.load();

    const action_customize = new Gio.SimpleAction({ name: "customize" });
    action_customize.connect("activate", (_self) => {
      this.customize().catch(console.error);
    });
    this.add_action(action_customize);
  }

  onActive() {
    this.updateTime();
    if (this.source_id !== null) return;
    this.source_id = GLib.timeout_add_seconds(GLib.PRIORITY_HIGH, 1, () => {
      this.updateTime();
      return GLib.SOURCE_CONTINUE;
    });
  }
  onSuspended() {
    if (this.source_id === null) return;
    GLib.Source.remove(this.source_id);
    this.source_id = null;
  }

  async customize() {
    if (!window_editor) {
      const { default_style, file, updateStyle, application } = this;
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
  }

  bind_state() {
    settings.bind(
      "maximized",
      this,
      "maximized",
      Gio.SettingsBindFlags.DEFAULT
    );
    settings.bind(
      "fullscreened",
      this,
      "fullscreened",
      Gio.SettingsBindFlags.DEFAULT
    );

    this.connect("notify::suspended", () => {
      this.suspended ? this.onSuspended() : this.onActive();
    });
    !this.suspended && this.onActive();

    // Resizing the window triggers a lot of notify signals
    // so we use a debounced function instead of settings.bind
    const onSizeChanged = debounce(() => {
      settings.set_int("width", this.default_width);
      settings.set_int("height", this.default_height);
    });
    this.connect("notify::default-width", onSizeChanged);
    this.connect("notify::default-height", onSizeChanged);
    this.default_width = settings.get_int("width");
    this.default_height = settings.get_int("height");

    this.bind_property(
      "maximized",
      this._header,
      "visible",
      GObject.BindingFlags.INVERT_BOOLEAN
    );
    this.bind_property(
      "fullscreened",
      this._header,
      "visible",
      GObject.BindingFlags.INVERT_BOOLEAN
    );
  }

  load() {
    this.default_style = new TextDecoder("utf8").decode(
      Gio.resources_lookup_data(
        "/re/sonny/Retro/src/clock.css",
        Gio.ResourceLookupFlags.NONE
      ).toArray()
    );

    const css_provider = new Gtk.CssProvider();
    css_provider.load_from_string(this.default_style);
    Gtk.StyleContext.add_provider_for_display(
      this.get_display(),
      css_provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION - 2
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
    window_editor?.onCssProvider(css_provider);
    if (text) {
      css_provider.load_from_string(text);
    }
    Gtk.StyleContext.add_provider_for_display(
      this.get_display(),
      css_provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION - 1
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
    InternalChildren: ["background", "foreground", "header"],
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

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}
