import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Template from "./window.blp" assert { type: "uri" };
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Xdp from "gi://Xdp";

const portal = new Xdp.Portal();
const portal_settings = portal.get_settings();
const settings = new Gio.Settings({
  schema_id: "re.sonny.Retro",
  path: "/re/sonny/Retro/",
});

const GNOME_DESKTOP_INTERFACE = "org.gnome.desktop.interface";
const CLOCK_FORMAT = "clock-format";
const DISPLAY_SECONDS = "display-seconds";

let window_editor;

class RetroWindow extends Adw.ApplicationWindow {
  display_seconds = null;
  clock_format = null;
  format = null;
  source_id = null;

  constructor(application) {
    super({ application });
    this.bindSettings();
    this.updateFormat();
    this.bindWindowState();
    this.load();
    this.setupActions();
  }

  setupClockFormat() {
    const clock_format = settings.get_string(CLOCK_FORMAT);
    if (clock_format !== "system") {
      this.clock_format = clock_format;
    } else {
      try {
        this.clock_format = portal_settings.read_string(
          GNOME_DESKTOP_INTERFACE,
          CLOCK_FORMAT,
          null
        );
      } catch (err) {
        this.clock_format = "24h";
        console.warn(err);
      }
    }
    this.display_seconds = settings.get_boolean(DISPLAY_SECONDS);
  }

  bindSettings() {
    this.setupClockFormat();
    settings.connect("changed", (_self, key) => {
      if (key === DISPLAY_SECONDS) {
        this.display_seconds = settings.get_boolean(DISPLAY_SECONDS);
      } else if (key === CLOCK_FORMAT) {
        this.setupClockFormat();
      } else {
        return;
      }
      this.update();
    });

    portal_settings.connect("changed", (_self, namespace, key, _value) => {
      if (namespace !== GNOME_DESKTOP_INTERFACE) return;
      if (key !== CLOCK_FORMAT) return;
      this.setupClockFormat();
      this.update();
    });
  }

  setupActions() {
    this.add_action(settings.create_action(DISPLAY_SECONDS));

    const action_customize = new Gio.SimpleAction({ name: "customize" });
    action_customize.connect("activate", (_self) => {
      this.customize().catch(console.error);
    });
    this.add_action(action_customize);
  }

  updateFormat() {
    let format;
    if (this.clock_format === "24h") {
      format = this.display_seconds ? FORMAT_24_SECONDS : FORMAT_24;
    } else {
      format = this.display_seconds ? FORMAT_12_SECONDS : FORMAT_12;
    }
    this.format = format;

    if (this.display_seconds) {
      this._background.label = "88:88:88";
    } else {
      this._background.label = "88:88";
    }
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

  bindWindowState() {
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
    this.updateFormat();
    this.updateTime();
  }

  updateTime() {
    const datetime = GLib.DateTime.new_now_local();
    this._foreground.label = datetime.format(this.format);
  }
}

const FORMAT_24 = "%R";
const FORMAT_24_SECONDS = "%T";
const FORMAT_12 = "%l:%M";
const FORMAT_12_SECONDS = `${FORMAT_12}:%S`;

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
