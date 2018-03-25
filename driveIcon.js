'use strict';
const Lang = imports.lang;
const Main = imports.ui.main;
const St = imports.gi.St;

const STATE_SPINNING = 0;
const STATE_SPINDOWN = 1;
const STATE_UNKNOWN= -1;

const DriveIcon = new Lang.Class({
    Name: 'DriveIcon',
    Extends: St.Icon,

    _init: function(name) {
        this._name = name;

        this.parent({
            style_class: 'system-status-icon',
            reactive: true
        });
        
        this._tooltip = new St.Label({
            style_class: 'tooltip'
        });

        this.status = STATE_UNKNOWN;

        this.connect('enter-event', Lang.bind(this, this._showTooltip));
        this.connect('leave-event', Lang.bind(this, this._hideTooltip));
        this.connect('destroy', Lang.bind(this, this._onDestroy));
    },

    _showTooltip: function() {
        if (this._tooltip.text === '') return;
        
        let height = this.get_height();
        let pos = this.get_transformed_position();
        Main.uiGroup.add_actor(this._tooltip);
        this._tooltip.set_position(pos[0] + 10, pos[1] + height + 5);
    },

    _hideTooltip: function() {
        let parent = this._tooltip.get_parent();
        if (parent) {
            parent.remove_actor(this._tooltip);
        }
    },

    _onDestroy: function(){
        this._tooltip.destroy();
    },

    syncAnimation: function(frame) {
        switch (this.status) {
            case STATE_SPINNING:
                this.icon_name = `my-spinning${frame%3}-symbolic`;
                break;
        
            case STATE_SPINDOWN:
                this.icon_name = `my-spindown-symbolic`;
                break;
                
            default:
                this.icon_name = `my-unknown-symbolic`;
                break;
        }

    },

    get tooltipText(){
        return this._tooltip.text;
    },
    set tooltipText(text){
        this._tooltip.text = text;        
    },

    get status(){
        return this._status;
    },
    set status(status){
        this._status = status;
        this.syncAnimation(0);
    }
});