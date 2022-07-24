import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';

import { RetroWindow } from './window.js';

pkg.initGettext();
pkg.initFormat();

export const RetroApplication = GObject.registerClass(
    class RetroApplication extends Adw.Application {
        constructor() {
            super({application_id: 're.sonny.Retro', flags: Gio.ApplicationFlags.FLAGS_NONE});

            const quit_action = new Gio.SimpleAction({name: 'quit'});
                quit_action.connect('activate', action => {
                this.quit();
            });
            this.add_action(quit_action);
            this.set_accels_for_action('app.quit', ['<primary>q']);

            const show_about_action = new Gio.SimpleAction({name: 'about'});
            show_about_action.connect('activate', action => {
                let aboutParams = {
                    authors: [
                        'Sonny Piers'
                    ],
                    version: '0.1.0',
                    program_name: 'retro',
                    transient_for: this.active_window,
                    modal: true,
                };
                const aboutDialog = new Gtk.AboutDialog(aboutParams);
                aboutDialog.present();
            });
            this.add_action(show_about_action);
        }

        vfunc_activate() {
            let {active_window} = this;

            if (!active_window)
                active_window = new RetroWindow(this);

            active_window.present();
        }
    }
);

export function main(argv) {
    const application = new RetroApplication();
    return application.run(argv);
}
