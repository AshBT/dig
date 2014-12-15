'use strict';

angular.module('digApp')
.controller('SearchCtrl', ['$scope', '$state', function ($scope, $state) {

	$scope.showresults = false;

	$scope.currentOpened = 0;
	$scope.selectedImage = 0;

	$scope.submit = function () {
		// if indexVM.query object is not null, then value for the query input
		// is not empty, so display results if any, otherwise do not
		// display results.
		if ($scope.indexVM.query) {
			$scope.showresults = true;
		}
		else {
			$scope.showresults = false;
		}
	};
	
	$scope.closeOthers = function(index, array) {
		if($scope.currentOpened < array.length) {
			array[$scope.currentOpened].isOpen = false;
		}
		$scope.currentOpened = index;
	};

	$scope.viewDetails = function(doc) {
		$scope.doc = doc;
		$state.go('search.list.details');
	};

	$scope.viewList = function() {
		if($scope.doc) {
			$scope.doc = null; 
		}
		$state.go('search.list');
	};

	$scope.selectImage = function(index) {
		$scope.selectedImage = index;
	};

	// Temporary until ad body text is cleaned up
	$scope.cleanString = function(str) {
		return str.replace(/[^a-z0-9\-\!\@\#\$\%\^\&\*\(\)\s\.\,\'\"']/gi, '');
	};

	if($state.current.name === 'search') {
		$scope.viewList();
	}
}]);