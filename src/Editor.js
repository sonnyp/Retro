import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Source from "gi://GtkSource";
import Pango from "gi://Pango";

import Template from "./editor.blp" assert { type: "uri" };

import { promiseTask } from "../troll/src/util.js";
import HoverProvider from "./HoverProvider.js";
import { getItersAtRange } from "./util.js";

const language_manager = Source.LanguageManager.get_default();
const scheme_manager = Source.StyleSchemeManager.get_default();
const style_manager = Adw.StyleManager.get_default();
const language = language_manager.get_language("css");

class EditorWindow extends Gtk.Window {
  constructor({ application, default_style, file, text, onChange }) {
    super({ application });

    const provider = new HoverProvider();
    this.provider = provider;
    prepareSourceView({ source_view: this._source_view, provider });

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

    setTimeout(() => {
      onChange(this._buffer.text);
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

  onCssProvider = (css_provider) => {
    this.provider.diagnostics = [];
    this._buffer.remove_tag_by_name(
      "error",
      this._buffer.get_start_iter(),
      this._buffer.get_end_iter()
    );
    css_provider.connect("parsing-error", this.onParsingError);
  };

  onParsingError = (css_parser, section, error) => {
    const diagnostic = getDiagnostic(section, error);
    this.provider.diagnostics.push(diagnostic);
    const [start_iter, end_iter] = getItersAtRange(
      this._buffer,
      diagnostic.range
    );
    this._buffer.apply_tag_by_name("error", start_iter, end_iter);
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

function prepareSourceView({ source_view, provider }) {
  const tag_table = source_view.buffer.get_tag_table();
  const tag = new Gtk.TextTag({
    name: "error",
    underline: Pango.Underline.ERROR,
  });
  tag_table.add(tag);

  const hover = source_view.get_hover();
  // hover.hover_delay = 25;
  hover.add_provider(provider);
}

// Converts a Gtk.CssSection and Gtk.CssError to an LSP diagnostic object
function getDiagnostic(section, error) {
  const start_location = section.get_start_location();
  const end_location = section.get_end_location();

  const range = {
    start: {
      line: start_location.lines,
      character: start_location.line_chars,
    },
    end: {
      line: end_location.lines,
      character: end_location.line_chars,
    },
  };

  return { range, message: error.message };
}
