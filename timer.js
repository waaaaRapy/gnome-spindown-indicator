const Lang = imports.lang;
const Mainloop = imports.mainloop;

var Timer = new Lang.Class({
    Name: 'Timer',

    /**
     * @param {number} interval
     * @param {function} callback 実行する関数。 trueを返すと繰返し
     */
    _init: function(interval, callback) {
        this._loop = callback;
        this._timerId = null;
        this._interval = interval;
    },

    /**
     * タイマーを開始する
     * @param {bool} invoke trueのとき初回の実行を即座に行う
     * @return {Timer} メソッド―チェーン可能。
     */
    start: function(invoke) {
        if (typeof invoke === 'undefined') {
            invoke = true;
        }
        this.resetInterval(this._interval, invoke);
        return this;
    },

    /**
     * タイマーの周期をリセットする
     * @param {number} interval 周期(ms) 
     * @param {bool} invoke trueのとき初回の実行を即座に行う
     * 
     * @description 既にタイマーを実行中なら一度キャンセルして実行し直す
     */
    resetInterval: function(interval, invoke){
        if (typeof interval === 'number' && interval > 0) {
            this._interval = interval;
        } else {
            throw new Error('interval must be larger than 0');
        }

        if (typeof invoke === 'undefined') {
            invoke = true;
        }

        if (typeof this._timerId === 'number') {
            // timer already started
            this.stop();
        }
        this._timerId = Mainloop.timeout_add(
            this._interval,
            this._loop
        );

        if (invoke) {
            this._loop();
        }
    },

    /**
     * タイマーを停止
     */
    stop: function() {
        if (typeof this._timerId === 'number') {
            Mainloop.source_remove(this._timerId);    
        }
    },

    get interval() {
        return this._interval;
    }
});