var demoApp = angular.module("demoApp", [
  "restangular",
  "ui.bootstrap",
  "cgBusy"
]);

demoApp.service("PostModel", ["Restangular", function(Restangular){
  this.fetch = function(start, end){
    var url = 'https://jsonplaceholder.typicode.com/posts';
    var params = [];
    if (start !== undefined) { params.push('_start=' + start); }
    if (end !== undefined) { params.push('_end=' + end); }
    if (params.length) { url += '?' + params.join('&'); }
    return Restangular.allUrl('posts', url).getList();
  }
}]);

demoApp.controller("demoCtrl", ["$scope", "$uibModal", "PostModel", function($scope, $uibModal, PostModel){
  $scope.postsPromise = PostModel.fetch(0, 9);
  $scope.postsPromise.then(function(response){
    $scope.posts = response.map((el) => { return el.plain(); });
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
