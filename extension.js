'use strict';

const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const DriveIcon = Me.imports.driveIcon;
const UDisks2 = Me.imports.udisks2.UDisks2;
const Timer = Me.imports.timer.Timer;


const SpinStatusMenu = new Lang.Class({
    Name: 'SpinStatusMenu',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(St.Align.START);
        this.connect('destroy', Lang.bind(this, this._onDestroy));

        this._settings = Convenience.getSettings();
        
        this._drives = {};
        this._menu = new St.BoxLayout();
        this.actor.add_actor(this._menu);

        this._frame = 0;
        this._uiTimer = new Timer(
            1000,
            Lang.bind(this, this._updateUi)
        );
        this.connect('destroy', () => this._uiTimer.stop());
        this._uiTimer.start();

        this._infoTimer = new Timer(
            15000,
            Lang.bind(this, this._updateInfo)
        );
        this.connect('destroy', () => this._infoTimer.stop());

        this._udisks = new UDisks2();
        this._udisks.initialize().then(() => {
            this._updateDisks();
            this._infoTimer.start();
        });
    },

    _updateDisks: function() {
        let updated = {};
        this._udisks.getAtaDrives().map((drive) => {
            let id = drive.getId();
            // add new drives
            if (this._drives[id] === undefined) {
                let icon = new DriveIcon.DriveIcon(id);
                icon.tooltipText = id;
                this._menu.add_actor(icon);
                this._drives[id] = {
                    'iface': drive,
                    'icon': icon,
                }
                updated[id] = true;
            }
        });
        // remove invalided drives
        for (const id in this._drives) {
            if (this._drives.hasOwnProperty(id)) {
                if (!updated[id]){
                    this._drives[id].icon.destroy();
                    delete this._drives[id];
                }
            }
        }
    },

    _updateUi: function() {
        this._frame++;
        for (const id in this._drives) {
            if (this._drives.hasOwnProperty(id)) {
                const drive = this._drives[id];
                drive.icon.syncAnimation(this._frame);
            }
        }

        return true;
    },

    _updateInfo: function() {
        for (const id in this._drives) {
            if (this._drives.hasOwnProperty(id)) {
                const drive = this._drives[id];
                drive.iface.callPmGetState().then((val) => {
                    if (val == 0) {
                        drive.icon.status = DriveIcon.STATE_SPINDOWN;
                    } else {
                        drive.icon.status = DriveIcon.STATE_SPINNING;
                    }
                }).catch(() => {
                    drive.icon.status = DriveIcon.STATE_UNKNOWN;                    
                })
            }
        }

        return true;
    },

    _onDestroy: function() {
    },

    get positionInPanel() {
        return this._settings.get_string('position-in-panel');
    }
});

let spinStatusMenu;

function init(extensionMeta) {
    Convenience.initTranslations();
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");
}

function enable() {
    spinStatusMenu = new SpinStatusMenu();
    let positionInPanel = spinStatusMenu.positionInPanel;
    Main.panel.addToStatusArea('spin-status', spinStatusMenu, 0, positionInPanel);
}

function disable() {
    spinStatusMenu.destroy();
    spinStatusMenu = null;
}
