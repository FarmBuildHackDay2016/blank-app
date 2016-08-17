angular.module('farmbuild.webmapping.examples')

	.run(function ($rootScope) {
	})

	.factory('Treatment',
	function () {
	
		
		var _treatmentTypes = {
			"chemical": ['Glymount 540K Herbicide','Novaguard Glyphosate 540 K Herbicide','GLYPHOSATE','AGROCHINA GLYPHOSATE 450 SL HERBICIDE']
		}
		
		return {
			treatmentTypes: _treatmentTypes
		}
		
	});