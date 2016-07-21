var demoApp = angular.module("demoApp", [
  "restangular",
  "ui.bootstrap",
  "cgBusy"
]);

demoApp.config(["RestangularProvider", function(RestangularProvider){
  RestangularProvider.setFullResponse(true);
}]);

demoApp.constant("baseURL", "https://jsonplaceholder.typicode.com");

demoApp.service("Status", function(){
  this.isSuccessful = function isSuccessful(status){
    return status === 200 || status === 204;
  };

  this.needsAuthorization = function needsAuthorization(status){
    return status === 207;
  };
});

demoApp.service("Async", ["$q", "$timeout", function($q, $timeout){
  this.delay = function delay(originalPromise, time){
    var deferred = $q.defer();

    $timeout(function asyncTimeoutHandler() {
      originalPromise.then(function originalPromiseSuccess(response){
        deferred.resolve(response);
      }, function originalPromiseFailure(reason){
        deferred.resolve(reason);
      });
    }, time);
    return deferred.promise;
  };
}]);

demoApp.service("AuthModel", ["$http", "Async", "baseURL", function($http, Async, baseURL){
  this.get = function(token){
    return Async.delay($http.get(baseURL + "/auth/" + token), 1000);
  };
}]);

demoApp.service("Authorization", ["$q", "$timeout", "AuthModel", function($q, $timeout, AuthModel){
  this.authorize = function authorize(token){
    var deferred = $q.defer();

    $timeout(function() {
      AuthModel.get(token).then(function(response){
        deferred.resolve(response);
      }, function(response){
        debugger;
      });
    }, 1500);

    return deferred.promise;
  };
}]);

demoApp.service("PostModel", ["$q", "Restangular", "Status", "Async", "Authorization", "baseURL", function($q, Restangular, Status, Async, Authorization, baseURL){
  this.getCollection = function(start, end){
    var url = baseURL + '/posts';
    var params = {};
    if (start !== undefined) { params._start = start; }
    if (end !== undefined) { params._end = end; }
    return Restangular.allUrl("base", baseURL).all("posts").getList(params);
  };

  this.getCollectionDelayed = function(start, end) {
    return Async.delay(this.getCollection(start, end), 2000);
  };

  this.getItem = function(id){
    var itemPromise = Restangular.allUrl("base", baseURL).one('posts', id).get();
    var deferred = $q.defer();

    itemPromise.then(function(itemResponse){
      if (Status.isSuccessful(itemResponse.status)){ // successful case - no additional authorization
        deferred.resolve(itemResponse.data);
      } else if (Status.needsAuthorization(itemResponse.status)) {
        // I expect "X-AUTH-NEEDED" to be here
        var token = itemResponse.headers("X-AUTH-NEEDED");
        Authorization.authorize(token).then(function(authorizationResponse){
          deferred.resolve(authorizationResponse.data);
        });
      } else {
        alert("Unhandled status: " + response.status);
      }
    }, function(reason){
      deferred.reject(reason);
    });

    return deferred.promise;
  };
}]);

demoApp.controller("callCtrl", ["$scope", "$uibModal", "PostModel", function($scope, $uibModal, PostModel) {
  $scope.display = '';
  $scope.itemPromise = null;

  $scope.call = function(id){
    this.clear();
    $scope.itemPromise = PostModel.getItem(id);
    $scope.itemPromise.then(function(response){
      $scope.display = JSON.stringify(response, null, 2);
    });
  };

  $scope.clear = function () {
    $scope.display = '';
  };
}]);

demoApp.controller("demoCtrl", ["$scope", "$uibModal", "PostModel", function($scope, $uibModal, PostModel){
  $scope.postsPromise = PostModel.getCollectionDelayed(0, 9);
  $scope.postsPromise.then(function(response){
    $scope.posts = response.data.map((el) => { return el.plain(); });
  });

  $scope.open = function (id) {
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: "lg",
      resolve: {
        post: function () {
          return $scope.posts.find((el) => {return el.id == id;});
        }
      }
    });

    modalInstance.result.then(function () {
      console.log("has been resolved", arguments);
    }, function () {
      console.log("has been rejected", arguments);
    });
  };
}]);

demoApp.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, post) {
  $scope.post = post;

  $scope.ok = function () {
    $uibModalInstance.close("ok");
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");
  };
});
