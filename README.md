# ng-multi-step-process

Experimenting with angular multi-step business process flow

## Files

* `js/` and `css/` directories are just a hard-copy of bundles downloaded from npm - in order to quickly display assets on github pages, which require all files to be available as source
* mocks defined in `src/mocks.js`

## Logic

* all REST resources might either **return the response directly** or **send `207` status** informing that *Authorization* process is needed in order to finish processing the request
* *Authorization* process is a dummy stuff that does a timeout - it's an example of a process that needs to be performed
  * the process will use existing promises (such as AJAX requests promises, modal window promises, etc) and wrap them with its own custom promises
  * `Authorization` service is performing *entire* process within `Authorization.wrap`
  * `AuthModel` is never directly used; it handles _Authorization_ process only
* `PostModel` is an ordinary domain logic model
  * all its public methods are wrapped with `Autorization.wrap`
