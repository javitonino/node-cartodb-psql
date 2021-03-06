'use strict';

require('../setup');

var _ = require('underscore');
var assert = require('assert');
var PSQL = require('../../lib/psql');

var dbopts_anon = {
    host: global.settings.db_host,
    port: global.settings.db_port,
    user: global.settings.db_pubuser,
    dbname: _.template(global.settings.db_base_name, {user_id: 1}),
    pass: global.settings.db_pubuser_pass
};

describe('psql', function() {

    it('test throws error if no args passed to constructor', function(){
        var psql;
        var msg;
        try {
            psql = new PSQL();
        } catch (err){
            msg = err.message;
        }
        assert.ok(!psql);
        assert.equal(msg, "Incorrect access parameters." +
            " If you are accessing via OAuth, please check your tokens are correct." +
            " For public users, please ensure your table is published.");
    });

    it('dbkey depends on dbopts', function(){
        var opt1 = _.clone(dbopts_anon);
        opt1.dbname = 'dbname1';
        var pg1 = new PSQL(opt1);

        var opt2 = _.clone(dbopts_anon);
        opt2.dbname = 'dbname2';
        var pg2 = new PSQL(opt2);

        assert.ok(pg1.dbkey() !== pg2.dbkey(),
                'both PSQL object using same dbkey ' + pg1.dbkey());

        assert.ok(_.isString(pg1.dbkey()), "pg1 dbkey is " + pg1.dbkey());
    });

});


describe('pool params', function() {
    var POOL_DEFAULT_SIZE,
        POOL_DEFAULT_IDLE_TIMEOUT,
        POOL_DEFAULT_REAP_INTERVAL;

    var globalSettings;

    before(function() {
        globalSettings = global.settings;

        var pg = new PSQL(dbopts_anon);
        POOL_DEFAULT_SIZE = pg.POOL_DEFAULT_SIZE;
        POOL_DEFAULT_IDLE_TIMEOUT = pg.POOL_DEFAULT_IDLE_TIMEOUT;
        POOL_DEFAULT_REAP_INTERVAL = pg.POOL_DEFAULT_REAP_INTERVAL;
    });

    beforeEach(function() {
        global.settings = {};
    });

    after(function() {
        global.settings = globalSettings;
    });

    it('default params are used if global.settings or specific settings are not provided', function() {
        testPoolParams(POOL_DEFAULT_SIZE, POOL_DEFAULT_IDLE_TIMEOUT, POOL_DEFAULT_REAP_INTERVAL);
    });

    it('global pool params are used if they exist', function() {
        var size = 1,
            idle = 10,
            reap = 5;

        global.settings.db_pool_size = size;
        global.settings.db_pool_idleTimeout = idle;
        global.settings.db_pool_reapInterval = reap;

        testPoolParams(size, idle, reap);
    });

    it('global pool params have precedence over default', function() {
        var size = 1;
        global.settings.db_pool_size = size;

        testPoolParams(size, POOL_DEFAULT_IDLE_TIMEOUT, POOL_DEFAULT_REAP_INTERVAL);
    });

    it('poolParams method params are used', function() {
        var size = 1,
            idle = 10,
            reap = 5;

        testPoolParams(size, idle, reap, {size: size, idleTimeout: idle, reapInterval: reap});
    });

    it('poolParams have precedence over global and over default', function() {
        var globalIdle = 10,
            paramReap = 5;

        global.settings.db_pool_idleTimeout = globalIdle;

        testPoolParams(POOL_DEFAULT_SIZE, globalIdle, paramReap, {reapInterval: paramReap});
    });

    function testPoolParams(expectedSize, expectedIdleTimeout, expectedReapInterval, poolParams) {
        var pg = new PSQL(dbopts_anon, poolParams);

        assert.equal(pg.poolParams.size, expectedSize);
        assert.equal(pg.poolParams.idleTimeout, expectedIdleTimeout);
        assert.equal(pg.poolParams.reapInterval, expectedReapInterval);
    }
});
