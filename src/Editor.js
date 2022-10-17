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
  constructor({ application, default_style, file, text, onChange }) {
    super({ application });

    this._buffer.set_language(language);
    this._buffer.text = text;

    this.updateStyleScheme();
    style_manager.connect("notify::dark", () => {
      this.updateStyleScheme();
    });

    this.default_style = default_style;
    this._button_reset.connect("clicked", this.reset);

    this.source_file = new Source.File({
      location: file,
    });

    this._buffer.connect("changed", () => {
      onChange(this._buffer.text);
    });

    this.updateButtonReset();
    this._buffer.connect("modified-changed", () => {
      this.updateButtonReset();
      if (!this._buffer.get_modified()) return;
      this.save().catch(logError);
    });
  }

  updateStyleScheme() {
    const { dark } = style_manager;
    const scheme = scheme_manager.get_scheme(dark ? "Adwaita-dark" : "Adwaita");
    this._buffer.set_style_scheme(scheme);
  }

  updateButtonReset() {
    this._button_reset.sensitive =
      this._buffer.text.trim() !== this.default_style.trim();
  }

  async save() {
    const file_saver = new Source.FileSaver({
      buffer: this._buffer,
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
      this._buffer.set_modified(false);
    }
  }

  reset = () => {
    this._buffer.text = this.default_style;
  };
}

export default GObject.registerClass(
  {
    GTypeName: "EditorWindow",
    Template,
    InternalChildren: ["source_view", "button_reset", "buffer"],
  },
  EditorWindow
);
