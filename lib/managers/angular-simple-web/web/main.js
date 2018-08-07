/// <reference path="../node_modules/@types/angular/index.d.ts" />
/// <reference path="../node_modules/@types/angular/jqlite.d.ts" />


/**
 * @author Sebastian Hönel <development@hoenel.net>
 */
class Controller {
  /**
   * @param {angular.IScope} $scope
   */
  constructor($scope) {
    this.$scope = $scope;
    this._isReady = false;

    setTimeout(() => {
      this._isReady = true;
      this.$scope.$digest();
    }, 1e3);
  };

  get isReady() {
    return this._isReady;
  };
};


const app = angular.module('app', []);
app.controller('Ctrl', ['$scope', Controller]);
angular.bootstrap(document.body, ['app']);
