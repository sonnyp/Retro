import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';

export const RetroWindow = GObject.registerClass({
    GTypeName: 'RetroWindow',
    Template: 'resource:///re/sonny/Retro/window.ui',
    InternalChildren: ['label', 'background'],
}, class RetroWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        const label = this._label;
        const background = this._background;


        // this._label.use_markup = true;

        background.label = `88:88:88`
        background.opacity = 0.2


        function updateTime() {
          const datetime = GLib.DateTime.new_from_unix_local(GLib.get_real_time() / 1000000)
          label.label = datetime.format('\%T')
        }

        updateTime();
        GLib.timeout_add_seconds(GLib.PRIORITY_HIGH, 1, () => {
          updateTime();
          return GLib.SOURCE_CONTINUE;
        })
    }
});

