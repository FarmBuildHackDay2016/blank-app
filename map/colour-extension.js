/**
 * @author Parham
 * @since 19/05/2016
 */



var farmdata = farmbuild.farmdata.find(),
	paddocks = farmdata.paddocks,
	paddocksLayer,
	soilSampleImporter = farmbuild.soilSampleImporter,
	features;

function convertHex(hex,opacity){
	hex = hex.replace('#','');
	var r = parseInt(hex.substring(0,2), 16),
	g = parseInt(hex.substring(2,4), 16),
	b = parseInt(hex.substring(4,6), 16),
	result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
	return result;
}

setTimeout(function () {
	paddocksLayer = farmbuild.webmapping.olHelper.paddocksLayer(olMap);
	features = paddocksLayer.getSource().getFeatures();
	features.forEach(function (feature) {
		var paddock = findPaddockByName(farmbuild.farmdata.find().paddocks, feature.getProperties().name),
			colour = getPaddockColor(farmdata, paddock, 'Olsen Phosphorus (mg/kg)');
		feature.setStyle(new ol.style.Style({
			fill: new ol.style.Fill({
				color: convertHex(colour, 65)
			})
		}))
	})
}, 100);

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
function getPaddockColor(farmdata, paddock, sampleType) {
	var found;
	if (paddock.soils && paddock.soils.sampleResults && paddock.soils.sampleResults.length > 0) {
		paddock.soils.sampleResults.forEach(function (sampleResult) {
			for (var sample in sampleResult) {
				if (sampleResult.hasOwnProperty(sample) && sample == sampleType) {
					var avg = getPaddockAverage(farmdata, paddock.name),
						colour = getSampleResultClassification(avg, sample).defaultColor;
					console.info('Sample Result Classification colour for ' + sampleType + ' in paddock: ', paddock, colour);
					found = colour;
				}
			}
		})
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
	paddocks.forEach(function (p) {
		console.info('findPaddockById',paddocks, name, p);
		if (p.name = name) {
			found = p;
		}
	})
	return found;
}