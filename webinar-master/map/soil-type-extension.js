/**
 * @author Parham
 * @since 19/05/2016
 */

angular.module('farmbuild.webmapping.examples')
	.factory('soilTypeExtension', function (validations, $log, $rootScope) {

		var paddocksLayer,
			soilSampleImporter = farmbuild.soilSampleImporter,
			features;

		function convertHex(hex, opacity) {
			hex = hex.replace('#', '');
			var r = parseInt(hex.substring(0, 2), 16),
				g = parseInt(hex.substring(2, 4), 16),
				b = parseInt(hex.substring(4, 6), 16);
			return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
		}

		function colourPaddocks(olMap) {
			paddocksLayer = farmbuild.webmapping.olHelper.paddocksLayer(olMap);
			features = paddocksLayer.getSource().getFeatures();
			features.forEach(function (feature) {
				var farmdata = farmbuild.farmdata.find(), paddock = findPaddockByName(farmbuild.farmdata.find().paddocks, feature.getProperties().name),
//					colour = getPaddockColor(farmbuild.farmdata.find(), paddock, 'Olsen Phosphorus (mg/kg)');
				colour = getPaddockColor(farmbuild.farmdata.find(), paddock);
				feature.setStyle(new ol.style.Style({
					fill: new ol.style.Fill({
						color: convertHex(colour, 65)
					}),
					stroke: new ol.style.Stroke({
						color: 'rgba(238,238,238,.7)',
						width: 1
					})
				}))
			})
		};


		/**
		 * Get object containing name,min,max,defaultColor for the given string key value of a import field name
		 * @param sampleResult
		 * @param key import field name string value (check API documentation for more details)
		 * @return {*}
		 */
		function getSampleResultClassification(sampleResult, key) {
			if (!sampleResult) {
				$log.info('avg result is undefined');
				return undefined;
			}
			/**
			 * Check if the given import field has a classification associated with it. If so classify it.
			 */
			if (soilSampleImporter.importField.hasClassification(key)) {
				return soilSampleImporter.soilClassification.classifyResult(sampleResult, key);
			}
			return "N/A";
		}

		/**
		 * Get average of values over soil samples results for a given paddock
		 * @param farmData
		 * @param paddockName to average over
		 * @return {array|*}
		 */
		function getPaddockAverage(farmData, paddockName) {
			return soilSampleImporter.paddockSoilSampleRetriever.averagesForPaddock(farmData, paddockName);
		}

		/**
		 * Find average values over soil samples results for a given paddockGroup
		 * @param farmdata
		 * @param paddock
		 * @param sampleType
		 * @return {*}
		 */
//		function getPaddockColor(farmdata, paddock, sampleType) {
//			var found;
//			if (paddock.soils && paddock.soils.sampleResults && paddock.soils.sampleResults.length > 0) {
//				paddock.soils.sampleResults.forEach(function (sampleResult) {
//					for (var sample in sampleResult) {
//						if (sampleResult.hasOwnProperty(sample) && sample == sampleType) {
//							var avg = getPaddockAverage(farmdata, paddock.name),
//								colour = getSampleResultClassification(avg, sample).defaultColor;
//							console.info('Sample Result Classification colour for ' + sampleType + ' in paddock: ', paddock, colour);
//							found = colour;
//						}
//					}
//				})
//			}
//			return found;
//		}
		
		// Map groups to colors
		/**var map = {
				'0' : "#66ff33",
				'P1' : "#ffff00",
				'P3' : "#0066ff",
				'P12' : "#cc9900",
				'2' : "#009933",
				'P1' : "#0066cc",
				'0' : "#66ff33",
		};*/
		
		var map = {
				'Medium' : "#66ff33",
				'Lemnos loam' : "#ffff00",
				'Goulburn loam' : "#0066ff",
		};
		
		/**
		 * Find average values over soil samples results for a given paddockGroup
		 * @param farmdata
		 * @param paddock
		 * @param sampleType
		 * @return {*}
		 */
					function getPaddockColor(farmdata, paddock) {
						var found = "#fffe03";
						
						
						
						if (paddock.soils && paddock.soils.soilAreas.types
								&& paddock.soils.soilAreas.types.length > 0) {
							if (paddock.soils.soilAreas.types[0]) {

							}
							
							
							var maxarea=0;
							var maxsoilclass="";
							
					
							paddock.soils.soilAreas.types.forEach(function(
									soilTypes) {
								

								if (soilTypes.area > maxarea) {
									maxarea = soilTypes.area;
									maxsoilclass = soilTypes.soilClass;
								}
								
							})
							
							colour = map[maxsoilclass]
							if (colour == null) {
								colour = "#66ff33";
							}
							console.info(
									'Soil Group: ' + maxsoilclass
											+ ' in paddock: ', paddock,
									colour);
							found = colour;
						}
						return found;
					}


					
					
					
					
		/**
		 * Find average values over soil samples results for a given paddockGroup
		 * @param paddocks
		 * @param name
		 * @return {*}
		 */
		function findPaddockByName(paddocks, name) {
			var found;
			var BreakException= {};
//			try {
			
				for (var i=0; i<paddocks.length;i++) {
					var paddock = paddocks[i];
					if (paddock.name == name) {
						return paddock;
					}
					
				}
				
//			paddocks.forEach(function (p) {
//				console.info('findPaddockById', paddocks, name, p);
//				if (p.name = name) {
//					found = p;
//					throw BreakException;
//				}
//			})
//			} catch(e) {
//			   
//			}
//			return found;
		}

		return {
			colourPaddocks: colourPaddocks
		}
	});