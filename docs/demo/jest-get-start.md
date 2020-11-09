# Jest Development
## Preparing
- Learning about `npm` or `yarn`

## In Normal Projects

> Full reference doc links [here](https://jestjs.io/docs/en/getting-started)

### Install Jest
```shell script
yarn add jest -dev
```
或
```shell script
npm i jest --save-dev
```

### Setup The Configuration File
  
1. Create javascript file in the root dir & named `'jest.config.js'`
2. With this JS file, export the configuration we needed
    e.g.
    ```javascript
    module.exports = {
        watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
        testMatch: ['<rootDir>/src/**/__tests__/**/*test.js'],
        coverageDirectory: 'build/test-coverage',
        coverageReporters: ['html', 'text'],
        collectCoverageFrom: [
            'src/main/*.js',
        ],
        rootDir: __dirname
    };
    ```

> `jest --init` command can help to create configuration file too.

### Run With ES6
1. Install babel
    ```shell script
    yarn add --dev babel-jest @babel/core @babel/preset-env
    ```
2. Create the configuration file named `'.babelrc'` in the root dir for babel
    ```json
    {
        "presets": [
            [
            "@babel/preset-env"
            ]
        ]
    }
    ```

> More configuration reference doc here: [Configuration Jest](https://jestjs.io/docs/en/configuration)

### Run Jest
- Run all test:
    ```shell script
    jest
    ```
- Run all test while files changed
    ```shell script
    # with git
    jest --watch
    ```
    ```shell script
    jest --watchAll
    ```
- Run all test & generator the code coverage result
    ```shell script
    jest --coverage
    ```
- We could add those commands to package.json
    ```json
    "scripts": {
        "test": "yarn run test:all",
        "test:all": "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage"
    },
    ```
    And the we could execute the command to run test
    ```shell script
    yarn run test
    ```

### Writing Test

#### Simple API
- `describe`
- `it` or `test`
- `beforeEach` & `afterEach`
- `beforeAll` & `afterAll`
- ...
> More reference links [here](https://jestjs.io/docs/en/setup-teardown)

#### Simple Matchers
Using the `chain expression` 
- `expect` method
    - receive one param as the expect result
- `toBe` matches when equals
    - `toBeNull` matches only `null`
    - `toBeUndefined` matches only `undefined`
    - `toBeDefined` is the opposite of toBeUndefined
    - `toBeTruthy` matches anything that an if statement treats as `true`
    - `toBeFalsy` matches anything that an if statement treats as `false`
- `not`
- `toMatch`
- `toThrow`
- ...

> More reference links [here](https://jestjs.io/docs/en/using-matchers)

#### Simple Mocks
Using mocked function by using the api - `jest.fn(func)`

- Using as the callback with function type params.  
    - If you want to assert the callback params, you can get the callback first called params from `mockCallback.mock.calls[0][index]`
    - `mockCallback.mock.results[0].value` means the return value of the first call to the function
    - `mockCallback.mock.calls.length` means the mock function is called twice
- Mock the return value (Using the `chain expression` )
    - `mockReturnValueOnce`
    - `mockReturnValue`
> More reference links [here](https://jestjs.io/docs/en/mock-functions)

#### Modules Mock
Mocking modules by using this api - `jest.mock()`

- `jest.mock(moduleName, factory, options)`
    ```javascript
    jest.mock('../moduleName', () => {
    return jest.fn(() => 42);
    });

    // This runs the function specified as second argument to `jest.mock`.
    const moduleName = require('../moduleName');
    moduleName(); // Will return '42';
    ```
- `moduleNameMapper` property in `jest.config.js`
    ```javascript
    module.exports = {
        // more...
        moduleNameMapper: {
            '^@module(.*)$': '<rootDir>/test/mock-module/$1'
        }
    };
    ```

## Jest for Lightning Web Component

### Install the jest plugins
```shell script
yarn add sfdx-lwc-jest -dev
```
或
```shell script
npm i sfdx-lwc-jest --save-dev
```

### Create the test source dir

- Using the commands - [CLI Commands](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_force_lightning.htm#cli_reference_force_lightning_lwc_test_create)
    ```shell script
    sfdx force:lightning:lwc:test:create -f force-app/main/default/lwc/myButton/myButton.js
    ```
- Execute the action by using VS Code.

### How to Test
#### Testing DOM
- To testing the DOM of LWC, the first thing is to create the component while testing, `createElement` method can help us.
    e.g.
    ```javascript
    import {createElement} from lwc;
    import myComponent from 'c/myComponent' // 'myComponent' is the custom component we are testing

    createElement(
        'c-my-component',
        {
            is: myComponent
        }
    )
    ```
- Testing initialed HTML rendered content
    ```javascript
    describe('c-jest01', () => {

        afterEach(() => {
            // The jsdom instance is shared across test cases in a single file so reset the DOM
            // The callback - disconnectCallback will be called
            while (document.body.firstChild) {
                document.body.removeChild(document.body.firstChild);
            }
        });

        it('Test initial content', () => {
            // create the element
            const element = createElement('c-jest01', {
                is: Jest01
            });

            // while element appended, the connectedCallback method will be called
            document.body.appendChild(element);

            // all the content is on the shadowRoot NODE
            const root = element.shadowRoot;

            const nameDiv = root.querySelector('.name');

            expect(nameDiv.textContent).toBe('hello world');
        });

    });
    ```
- Testing the component with props
    ```javascript
    it('Test props changed', async () => {
        const element = createElement('c-jest01', {
            is: Jest01
        });
        document.body.appendChild(element);
        element.content = 'Testing content';
        const root = element.shadowRoot;

        const contentDiv = root.querySelector('.content');

        // waiting the dom rendered
        await Promise.resolve();

        expect(contentDiv.textContent).toBe('Testing content');
    });
    ```
> For testing the dom, being better to testing with **`stateless components`**, the **`stateful components`** testing is relatively difficult

#### Mock Wire Service
1. Get the data snapshot & save it in the target dir named as `xxx.json` file
2. Using `registerLdsTestWireAdapter` set the target mocking
    ```javascript
    import { registerLdsTestWireAdapter } from '@salesforce/sfdx-lwc-jest';
    import { getRecord } from 'lightning/uiRecordApi';

    // ...
    const adapter = registerLdsTestWireAdapter(getRecord);
    // ...

    ```
3. While component initialed, call `emit` method of `adapter` to loading the mocked data
    ```javascript
    import { registerLdsTestWireAdapter } from '@salesforce/sfdx-lwc-jest';
    import { getRecord } from 'lightning/uiRecordApi';

    it('testing mocked wire service', async () => {
        // declared the wire adapter
        const adapter = registerLdsTestWireAdapter(getRecord);

        // load the mocked data
        const mockGetRecord = require('./mockData/getRecord.json');

        const element = createElement('c-jest01', { is: Jest01 });
        document.body.appendChild(element);

        // emit the saved data
        adapter.emit(mockGetRecord);

        // wait the DOM rendered
        await Promise.resolve();

        const root = element.shadowRoot;

        const serviceNameDiv = root.querySelector('.service-name');

        expect(serviceNameDiv.textContent).toBe(mockGetRecord.fields.Name.value);

    });

    ```

#### Testing Event Listener
Method - `addEventListener` in element to listen, `jest.fn` to mock.  
e.g.
```javascript
it('Test event handler', () => {
    const element = createElement('c-jest01', {
        is: Jest01
    });

    // create mock function
    const connectCallback = jest.fn();

    // listen connect
    element.addEventListener('connected', connectCallback);

    document.body.appendChild(element);

    // the callback executed once
    expect(connectCallback.mock.calls.length).toBe(1);
});
```

#### Mock Importing Modules

- With `moduleNameMapper` in configuration
    1. Download the basic resources from [lwc-recipes](https://github.com/trailheadapps/lwc-recipes/tree/master/force-app/test/jest-mocks)
    2. Create dir `/force-app/test` & zip above in it 
    3. In the property `moduleNameMapper`
        ```javascript
        module.export = {
            // other...
            moduleNameMapper: {
                '^@salesforce/apex$': '<rootDir>/force-app/test/jest-mocks/apex',
                '^@salesforce/schema$': '<rootDir>/force-app/test/jest-mocks/schema',
                '^lightning/navigation$':
                    '<rootDir>/force-app/test/jest-mocks/lightning/navigation',
                '^lightning/platformShowToastEvent$':
                    '<rootDir>/force-app/test/jest-mocks/lightning/platformShowToastEvent',
                '^lightning/uiRecordApi$':
                    '<rootDir>/force-app/test/jest-mocks/lightning/uiRecordApi',
                '^lightning/messageService$':
                    '<rootDir>/force-app/test/jest-mocks/lightning/messageService'
            },
        }
        ```
- With `jest.mock` function

> You can write the custom roles for all above

#### End-to-End Test

Jest is better for unit testing, using [Selenium WebDriver](https://www.seleniumeasy.com/selenium-tutorials/) or other tools for End-to-End Test
