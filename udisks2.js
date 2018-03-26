const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

var IFACE_DRIVE = "org.freedesktop.UDisks2.Drive";;
var IFACE_DRIVE_ATA = "org.freedesktop.UDisks2.Drive.Ata";

var UDisks2 = new Lang.Class({
    Name: 'UDisks2',

    _init: function(){
        this._objMgr = null;
        this._promise = null;
    },

    initialize: function() {
        this._promise = new Promise((resolve, reject) => {
            Gio.DBusObjectManagerClient.new(
                // Gio.DBusObjectManagerClient.new_for_bus?
                Gio.DBus.system,                // bus_type
                0,                              // flags
                "org.freedesktop.UDisks2",      // name
                "/org/freedesktop/UDisks2",     // object_path
                null,                           // get_proxy_type_func
                null,                           // cancellable
                (src, res) => {                 // callback
                    try {
                        this._objMgr = Gio.DBusObjectManagerClient.new_finish(res);
                        resolve();    
                    } catch (ex) {
                        reject(ex);
                    }
                }
            );
        });

        return this._promise;
    },

    getAtaDrives: function() {
        if (this._objMgr === null) {
            throw new Error('DBusObjectManagerClient is not initialized.');
        }
        return this._objMgr.get_objects().filter((o) => {
            return o.get_interface(IFACE_DRIVE_ATA) != null;
        }).map((o) => new AtaDrive(o));
    }
    
});

const AtaDrive = new Lang.Class({
    Name: "AtaDrive",
    
    _init: function(dbusObject) {
        this._driveInterface = dbusObject.get_interface(IFACE_DRIVE);
        this._ataInterface = dbusObject.get_interface(IFACE_DRIVE_ATA);

        // register property getters
        [this._driveInterface, this._ataInterface].forEach((iface) => {
            iface.get_cached_property_names().forEach((name) => {
                this[`get${name}`] = ((name) => 
                    () => iface.get_cached_property(name).deep_unpack()
                )(name);
            })
        });
    },

    callPmGetState: function() {
        return new Promise((resolve, reject) => {
            this._ataInterface.call(
                "PmGetState",       // method_name
                new GLib.Variant('(a{sv})', [{}]), // parameters
                0,                  // flags
                -1,                 // timeout_msec
                null,               // cancellable
                (src, res) => {     // callback
                    try {
                        let val = src.call_finish(res);
                        resolve(val.deep_unpack());    
                    } catch (ex) {
                        reject(ex);
                    }
                }
            )
        });
    }
})