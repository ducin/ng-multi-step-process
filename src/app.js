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



demoApp.service("AuthModel", ["$http", "baseURL", function($http, baseURL){
  this.get = function(token){
    return $http.get(baseURL + "/auth/" + token);
  };
}]);



demoApp.service("Authorization", ["$q", "$timeout", "AuthModel", "Status", function($q, $timeout, AuthModel, Status){
  var self = this;

  this.authorize = function authorize(token){
    var deferred = $q.defer();

    $timeout(function() {
      AuthModel.get(token).then(function(response){
        deferred.resolve(response);
      }, function(response){
        deferred.reject(reason);
      });
    }, 1500);

    return deferred.promise;
  };

  this.wrap = function(innerFunction){
    return function(){
      var args = Array.prototype.slice.call(arguments);
      var modelPromise = innerFunction.apply(this, args);
      var deferred = $q.defer();

      modelPromise.then(function(modelResponse){
        if (Status.isSuccessful(modelResponse.status)){ // successful case - no additional authorization
          deferred.resolve(modelResponse.data);
        } else if (Status.needsAuthorization(modelResponse.status)) {
          // I expect "X-AUTH-NEEDED" to be here
          var token = modelResponse.headers("X-AUTH-NEEDED");
          self.authorize(token).then(function(authorizationResponse){
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
  };
}]);



demoApp.service("PostModel", ["Restangular", "Authorization", "baseURL", function(Restangular, Authorization, baseURL){
  // all public methods of models return promise objects !!!
  //========================================================

  this.getCollection = Authorization.wrap(function(start, end){
    var params = {};
    if (start !== undefined) { params._start = start; }
    if (end !== undefined) { params._end = end; }
    return Restangular.allUrl("base", baseURL).all("posts").getList(params);
  });

  this.getItem = Authorization.wrap(function(id){
    return Restangular.allUrl("base", baseURL).one('posts', id).get();
  });
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



demoApp.controller("postsCtrl", ["$scope", "PostModel", "PostModal", function($scope, PostModel, PostModal){
  $scope.postsPromise = PostModel.getCollection(0, 9);
  $scope.postsPromise.then(function(response){
    $scope.posts = response.map((el) => { return el.plain(); });
  });

  $scope.open = function (id) {
    PostModal.open($scope, id).result.then(function () {
      console.log("has been resolved", arguments);
    }, function () {
      console.log("has been rejected", arguments);
    });
  };
}]);



demoApp.service("PostModal", ["$uibModal", function($uibModal){
  this.open = function($scope, id){
    return $uibModal.open({
      animation: true,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: "lg",
      resolve: {
        post: function () {
          return $scope.posts.find((el) => {return el.id == id; });
        }
      }
    });
  }
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
