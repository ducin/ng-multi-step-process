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

demoApp.service("PostModel", ["$q", "Restangular", "Status", "Authorization", "baseURL", function($q, Restangular, Status, Authorization, baseURL){
  this.getCollection = function(start, end){
    var params = {};
    if (start !== undefined) { params._start = start; }
    if (end !== undefined) { params._end = end; }
    return Restangular.allUrl("base", baseURL).all("posts").getList(params);
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

demoApp.controller("postsCtrl", ["$scope", "PostModel", "PostModal", function($scope, PostModel, PostModal){
  $scope.postsPromise = PostModel.getCollection(0, 9);
  $scope.postsPromise.then(function(response){
    $scope.posts = response.data.map((el) => { return el.plain(); });
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
