var demoApp = angular.module("demoApp", [
  "restangular",
  "ui.bootstrap"
]);

demoApp.controller("demoCtrl", ["$scope", "Restangular", function($scope, Restangular){
  Restangular.allUrl('posts', 'https://jsonplaceholder.typicode.com/posts?_start=0&_end=6').getList().then(function(response){
    $scope.posts = response.map((el) => { return el.plain(); });
  });
}]);
