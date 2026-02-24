import type { Options } from '@wdio/types'

export const config: Options.Testrunner = {
    runner: 'local',
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            project: './test/tsconfig.e2e.json',
            transpileOnly: true
        }
    },
    specs: [
        './test/specs/**/*.e2e.ts'
    ],
    exclude: [],
    maxInstances: 1,
    hostname: 'localhost',
    port: 4444,
    path: '/wd/hub',
    capabilities: [{
        browserName: 'firefox',
        'moz:firefoxOptions': {
            // args: ['-headless']
        }
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost:4200',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    framework: 'jasmine',
    reporters: ['spec'],
    jasmineOpts: {
        defaultTimeoutInterval: 60000,
        expectationResultHandler: function(passed, assertion) {
            // do something
        }
    },
}
