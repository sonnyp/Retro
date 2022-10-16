import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Template from "./window.blp" assert { type: "uri" };
import Editor from "./Editor.js";
import Source from "gi://GtkSource";
import Gtk from "gi://Gtk";
import { promiseTask } from "../troll/src/util.js";

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

    this.setupBuffer();

    const display_seconds = settings.create_action("display-seconds");
    this.add_action(display_seconds);

    settings.connect("changed", (sef, key) => {
      if (key !== "display-seconds") return;
      this.update();
    });

    this.default_style = new TextDecoder("utf8").decode(
      Gio.resources_lookup_data(
        "/re/sonny/Retro/src/style.css",
        Gio.ResourceLookupFlags.NONE
      ).toArray()
    );

    const action_customize = new Gio.SimpleAction({ name: "customize" });
    action_customize.connect("activate", (action) => {
      const { buffer, source_file, reset, default_style } = this;
      if (!window_editor)
        window_editor = new Editor({
          application,
          buffer,
          source_file,
          reset,
          default_style,
        });
      window_editor.present();
    });
    this.add_action(action_customize);
  }

  setupBuffer() {
    const buffer = new Source.Buffer();
    this.buffer = buffer;

    const file = Gio.File.new_for_path(
      GLib.build_filenamev([createDataDir(), "style.css"])
    );
    this.source_file = new Source.File({
      location: file,
    });

    this.buffer.connect("changed", () => {
      this.updateStyle();
    });

    this.load().catch(logError);
  }

  updateStyle() {
    if (this.css_provider) {
      Gtk.StyleContext.remove_provider_for_display(
        this.get_display(),
        this.css_provider
      );
      this.css_provider = null;
    }

    const css_provider = new Gtk.CssProvider();
    // css_provider.connect("parsing-error", (self, section, error) => {
    //   const diagnostic = getDiagnostic(section, error);
    //   panel_style.handleDiagnostic(diagnostic);
    // });
    if (this.buffer.text) {
      css_provider.load_from_data(this.buffer.text);
    }
    Gtk.StyleContext.add_provider_for_display(
      this.get_display(),
      css_provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
    this.css_provider;
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

  async load() {
    const file_loader = new Source.FileLoader({
      buffer: this.buffer,
      file: this.source_file,
    });

    let success;
    try {
      success = await promiseTask(
        file_loader,
        "load_async",
        "load_finish",
        GLib.PRIORITY_DEFAULT,
        null,
        null
      );
    } catch (err) {
      if (err.code !== Gio.IOErrorEnum.NOT_FOUND) {
        return logError(err);
      }
      success = false;
    }

    if (success) {
      this.buffer.set_modified(false);
    } else {
      this.reset();
    }
  }

  reset = () => {
    this.buffer.text = this.default_style;
  };
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
