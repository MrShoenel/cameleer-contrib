# sh.Cameleer-Contrib
Cameleer-contrib is an additional package for Cameleer (https://github.com/MrShoenel/cameleer) that holds extra Task-Types, Controllers/Managers and various extensions.

# Install via npm
`npm install sh.cameleer-contrib`

Note that this packages ___must be___ installed _alongside_ `Cameleer`, because it imports Cameleer's namespace and extends its types. Cameleer relies on `instanceof`-checks that will not work otherwise.

# List of current features
This list shows all current features of this package.

* __Managers__:
  * __AngularSimpleWeb__:
    * An angularjs-based web-manager for cameleer that shows its log, queues and tasks and currently allows for tasks with manual schedule to trigger them.
    * This manager comes with its own express-server and supports web-sockets. `typedef`s and extended `schemas` are to be found in meta.
    * This manager is still in an early stage and will get more features and better UI soon.
  * __TrayNotifier__:
    * A manager that observes Cameleer, its queues and its logs for messages and posts them to the system's tray, cross-platform, thanks to `node-notifier`.
    * Configurable: Configure sounds and which events to monitor (work, the log, the queues). Also shows messages when idle or shutting down.
* __Controllers__:
  * _&lt;none so far&gt;_; however, Cameleer comes with two built-in controllers. Please contribute yours!
* __Extras__:
  * __CameleerQueueObserver__:
    * A class that can encapsulate a `CameleerQueue` and monitor all of its properties, its status, jobs, utilization etc.
    * Emits events in JSON-format and comes with/exports extensive `typedef`s.
  * __CronSchedule__:
    * A _ManualSchedule_ for Cameleer that build on `node-schedule` and thus allows to schedule Tasks via cron!
  * __UrlCalendar__:
    * A sub-class of `Calendar` that can directly be constructed from a URL.
    * Supports any options that `request-promise` supports and forwards them (e.g. post- or authenticated requests).
* __Tasks__:
  * __7ZipTask__:
    * A specialized task that runs `7z`-processes to compress files. It automatically creates all necessary functional tasks, based on its configuration. Extra `typedef`s and schemas are exported.
    * This task also supports copying files/directories (recursively) by using `recursive-copy` internally. When compressing, setting a _password_ is possible (can be obtained async).
    * Supports recursively creating the target directory, path- and file name substitutions (like `%currentDate%`) and emptying the target-directory.
* __Tools__:
  * __WakeOnLan__:
    * An async function that supports waking computers on the network by their MAC address.
    * Uses the node package `wakeonlan` internally.

# Contributing
* __This package__:
  * This package uses `subpackage` so that nested packages with their own `package.json` are supported. The angular-simple-web Manager uses that. However, some extensions (e.g. CronSchedule) do not require a sub-package. Please choose the appropriate solution for your contribution.
  * Please submit _pull-requests_ and make sure your code is adequately tested. Starting from version 1.0.0 we will _require_ a coverage of `95%`.
* __Your own package__:
  * Should you have your own npm-package, please notify us by opening an issue in Cameleer (https://github.com/MrShoenel/cameleer). We will consider your package then and mention it in Cameleer's readme.md!
