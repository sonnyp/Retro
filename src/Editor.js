import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Source from "gi://GtkSource";

import Template from "./editor.blp" assert { type: "uri" };

const language_manager = Source.LanguageManager.get_default();
const scheme_manager = Source.StyleSchemeManager.get_default();
const style_manager = Adw.StyleManager.get_default();
const language = language_manager.get_language("css");

class EditorWindow extends Gtk.Window {
  constructor(application) {
    super({ application });

    this.updateStyle();
    this._buffer.connect("changed", () => {
      this.updateStyle();
    });
    this._buffer.set_language(language);

    this._buffer.text = new TextDecoder("utf8").decode(
      Gio.resources_lookup_data(
        "/re/sonny/Retro/src/style.css",
        Gio.ResourceLookupFlags.NONE
      ).toArray()
    );

    this.updateStyleScheme();
    style_manager.connect("notify::dark", () => {
      this.updateStyleScheme();
    });
  }

  updateStyleScheme() {
    const { dark } = style_manager;
    const scheme = scheme_manager.get_scheme(dark ? "Adwaita-dark" : "Adwaita");
    this._buffer.set_style_scheme(scheme);
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
    css_provider.load_from_data(this._buffer.text);
    Gtk.StyleContext.add_provider_for_display(
      this.get_display(),
      css_provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
    this.css_provider;
  }
}

export default GObject.registerClass(
  {
    GTypeName: "EditorWindow",
    Template,
    InternalChildren: ["source_view", "buffer"],
  },
  EditorWindow
);
