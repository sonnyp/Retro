import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Source from "gi://GtkSource";

import Template from "./editor.blp" assert { type: "uri" };

import { promiseTask } from "../troll/src/util.js";

const language_manager = Source.LanguageManager.get_default();
const scheme_manager = Source.StyleSchemeManager.get_default();
const style_manager = Adw.StyleManager.get_default();
const language = language_manager.get_language("css");

class EditorWindow extends Gtk.Window {
  constructor({ application, buffer, source_file }) {
    super({ application });

    this.buffer = buffer;
    this.source_file = source_file;
    this.buffer.set_language(language);

    this._source_view.buffer = buffer;

    this.updateStyleScheme();
    style_manager.connect("notify::dark", () => {
      this.updateStyleScheme();
    });

    this.buffer.connect("modified-changed", () => {
      if (!this.buffer.get_modified()) return;
      this.save().catch(logError);
    });
  }

  updateStyleScheme() {
    const { dark } = style_manager;
    const scheme = scheme_manager.get_scheme(dark ? "Adwaita-dark" : "Adwaita");
    this.buffer.set_style_scheme(scheme);
  }

  async save() {
    const file_saver = new Source.FileSaver({
      buffer: this.buffer,
      file: this.source_file,
    });
    const success = await promiseTask(
      file_saver,
      "save_async",
      "save_finish",
      GLib.PRIORITY_DEFAULT,
      null,
      null
    );
    if (success) {
      this.buffer.set_modified(false);
    }
  }
}

export default GObject.registerClass(
  {
    GTypeName: "EditorWindow",
    Template,
    InternalChildren: ["source_view"],
  },
  EditorWindow
);
