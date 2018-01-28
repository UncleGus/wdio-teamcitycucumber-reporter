'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Initialize a new TeamCity cucumber reporter.
 *
 * @param {Runner} runner
 * @api public
 */
var TccReporter = function (_events$EventEmitter) {
    _inherits(TccReporter, _events$EventEmitter);

    function TccReporter(baseReporter, config) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        _classCallCheck(this, TccReporter);

        var _this = _possibleConstructorReturn(this, (TccReporter.__proto__ || Object.getPrototypeOf(TccReporter)).call(this));

        _this.baseReporter = baseReporter;
        var epilogue = _this.baseReporter.epilogue;

        let testContext = {};

        _this.on('start', function () {
        });

        _this.on('suite:start', function (event) {
            if (!event.parent) {
                // output test suite description (feature)
                console.log(`##teamcity[testSuiteStarted flowId='${escape(event.specHash)}' name='${escape(event.title)}']`);
            } else {
                // output test description (scenario)
                const scenarioNumber = event.title.slice(0, 2);
                console.log(`##teamcity[testStarted flowId='${escape(event.specHash)}${scenarioNumber}' name='${escape(event.title)}' captureStandardOutput='false']`);
                // add a child to the testContext object for tracking the statuses of the step 'tests'
                testContext[event.uid] = {};
                // assume an unknown state of the testing until individual step 'tests' are evaluated
                testContext[event.uid].status = 'unknown';
            }
        });

        _this.on('hook:start', function (event) {
        });
        
        _this.on('hook:end', function (event) {
        });

        _this.on('test:start', function (event) {
            // individual step 'tests' are ignored
        });

        _this.on('test:end', function (event) {
            // individual step 'tests' are ignored
        });

        _this.on('test:pass', function (event) {
            // nothing is done here as the test is assumed to be passing until proven otherwise
        });

        _this.on('test:fail', function (event) {
            // status can change to fail from any state
            testContext[event.parent].status = 'fail';
            testContext[event.parent].error = event.err;
            testContext[event.parent].step = event.title;
        });

        _this.on('test:pending', function (event) {
            // only update the status of the test if it hasn't already failed or been marked as pending
            if (testContext[event.parent].status === 'unknown') {
                testContext[event.parent].status = 'pending';
                // this will be handled as a failed test, so an error object is required
                testContext[event.parent].error = {
                    message: 'Step is not defined',
                    stack: `Step '${event.title}' is undefined`
                };
                testContext[event.parent].step = event.title;
            }
        });

        _this.on('suite:end', function (event) {
            // if a child object exists on testContext, then this is a test (scenario) that is ending
            if (testContext[event.uid]) {
                const scenarioNumber = event.title.slice(0, 2);
                switch(testContext[event.uid].status) {
                    // this is a pass as nothing has happened to indicate a failure
                    case 'unknown':
                        console.log(`##teamcity[testFinished flowId='${escape(event.specHash)}${scenarioNumber}' name='${escape(event.title)}']`); break;
                    // all other statuses (i.e. 'fail' or 'pending') are treated as failure
                    default:
                        console.log(`##teamcity[testFailed flowId='${escape(event.specHash)}${scenarioNumber}' name='${escape(event.title)}' message='In step: ${escape(testContext[event.uid].step)}|n${escape(testContext[event.uid].error.message)}' details='${escape(testContext[event.uid].error.stack)}']`); break;
                        console.log(`##teamcity[testFailed flowId='${escape(event.specHash)}' name='${escape(event.title)}' message='In step: ${escape(testContext[event.uid].step)}|n${escape(testContext[event.uid].error.message)}' details='${escape(testContext[event.uid].error.stack)}']`); break;
                }
            } else {
                // this is the test suite (feature) that is ending
                console.log(`##teamcity[testSuiteFinished flowId='${escape(event.specHash)}' name='${escape(event.title)}']`);
            }
        });

        _this.on('end', function () {
        });

        _this.on(config.watch ? 'runner:end' : 'end', function () {
            epilogue.call(baseReporter);

            if (config.watch) {
                baseReporter.printEpilogue = true;
                baseReporter.stats.reset();
            }
        });
        return _this;
    }

    _createClass(TccReporter);
    return TccReporter;
}(_events2.default.EventEmitter);

function escape(str) {
    if (!str) return '';
  
    return str.toString().replace(/\|/g, '||').replace(/\n/g, '|n').replace(/\r/g, '|r').replace(/\[/g, '|[').replace(/\]/g, '|]').replace(/\u0085/g, '|x') // next line
    .replace(/\u2028/g, '|l') // line separator
    .replace(/\u2029/g, '|p') // paragraph separator
    .replace(/'/g, '|\'');
}

exports.default = TccReporter;
module.exports = exports['default'];