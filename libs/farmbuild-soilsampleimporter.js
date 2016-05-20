"use strict";

angular.module("farmbuild.soilSampleImporter", [ "farmbuild.core", "farmbuild.farmdata" ]).factory("soilSampleImporter", function(soilSampleImporterSession, soilSampleConverter, importField, soilSampleValidator, soilClassification, paddockSoilSampleRetriever, paddockGroups, importFieldSelector, farmdata, validations, googleAnalyticsSoilSampleImporter, $log) {
    var soilSampleImporter = {
        farmdata: farmdata
    }, _isPositiveNumber = validations.isPositiveNumber, _isDefined = validations.isDefined;
    soilSampleImporter.version = "0.1.0";
    soilSampleImporter.ga = googleAnalyticsSoilSampleImporter;
    soilSampleImporter.session = soilSampleImporterSession;
    $log.info("Welcome to Soil Sample Importer... " + "this should only be initialised once! why we see twice in the example?");
    soilSampleImporter.find = function() {
        return soilSampleImporterSession.find();
    };
    soilSampleImporter.load = function(inputFarmData) {
        var loaded = farmdata.load(inputFarmData);
        $log.info("loaded " + JSON.stringify(loaded, null, "  "));
        if (!_isDefined(loaded)) {
            return undefined;
        }
        if (!loaded.hasOwnProperty("soils")) {
            loaded.soils = {};
        }
        if (!loaded.soils.hasOwnProperty("sampleResults")) {
            loaded.soils.sampleResults = soilSampleImporter.soilSampleConverter.createDefault();
            loaded = farmdata.update(loaded);
        }
        return loaded;
    };
    soilSampleImporter.export = soilSampleImporterSession.export;
    soilSampleImporter.soilSampleConverter = soilSampleConverter;
    soilSampleImporter.soilSampleValidator = soilSampleValidator;
    soilSampleImporter.soilClassification = soilClassification;
    soilSampleImporter.importField = importField;
    soilSampleImporter.importFieldSelector = importFieldSelector;
    soilSampleImporter.paddockSoilSampleRetriever = paddockSoilSampleRetriever;
    soilSampleImporter.paddockGroups = paddockGroups;
    if (typeof window.farmbuild === "undefined") {
        window.farmbuild = {
            soilSampleImporter: soilSampleImporter
        };
    } else {
        window.farmbuild.soilSampleImporter = soilSampleImporter;
    }
    return soilSampleImporter;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilSampleConverter", function($log, farmdata, validations, soilSampleValidator, soilSampleImporterSession, importField) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, soilSampleConverter = {};
    function createDefault() {
        return {
            dateLastUpdated: new Date(),
            results: {
                columnHeaders: [],
                rows: []
            },
            importFieldDictionary: {},
            paddockRowDictionary: {},
            paddockNameColumn: undefined
        };
    }
    soilSampleConverter.createDefault = createDefault;
    function toFarmData(farmData, newSampleResults) {
        if (!_isDefined(farmData)) {
            $log.error("Invalid farmdata for soilSamplConverter.toFarmData");
            return undefined;
        }
        if (!_isDefined(newSampleResults)) {
            $log.error("Invalid newSampleResults for soilSamplConverter.toFarmData");
            return undefined;
        }
        if (!soilSampleValidator.isValidSoilSampleResult(newSampleResults)) {
            $log.error("Invalid newSampleResults for soilSamplConverter.toFarmData");
            return undefined;
        }
        var currentSoils = {};
        if (_isDefined(farmData.soils)) {
            currentSoils = farmData.soils;
        }
        var currentPaddocks = farmData.paddocks;
        if (!_isDefined(currentPaddocks)) {
            $log.error("Invalid FarmData for soilSamplConverter.toFarmData");
            return undefined;
        }
        var farmDataSampleResults = {};
        var newResults = newSampleResults.results;
        var newImportFieldDictionary = newSampleResults.importFieldDictionary;
        var importFieldNames = [];
        importFieldNames = Object.keys(newImportFieldDictionary);
        farmDataSampleResults.dateLastUpdated = newSampleResults.dateLastUpdated;
        farmDataSampleResults.importFieldNames = importFieldNames;
        currentSoils.sampleResults = farmDataSampleResults;
        var rows = newResults.rows;
        var paddockRowDictionary = newSampleResults.paddockRowDictionary;
        for (var i = 0; i < currentPaddocks.length; i++) {
            var singlePaddock = currentPaddocks[i];
            var paddockRows = paddockRowDictionary[singlePaddock.name];
            if (!_isDefined(paddockRows) || paddockRows.length == 0) {
                singlePaddock.soils = setSoilSamplResult(singlePaddock.soils, undefined);
                currentPaddocks[i] = singlePaddock;
                continue;
            }
            var singlePaddockSoils = [];
            for (var k = 0; k < paddockRows.length; k++) {
                var rowValues = rows[paddockRows[k]];
                var sampleValue = {};
                for (var j = 0; j < importFieldNames.length; j++) {
                    var temp = {};
                    var indexOfValue = newImportFieldDictionary[importFieldNames[j]];
                    var rowFieldValue = rowValues[indexOfValue];
                    if (importField.hasAverage(importFieldNames[j])) {
                        if (!_isEmpty(rowFieldValue) || !isNaN(rowFieldValue) || !(rowFieldValue == null)) {
                            rowFieldValue = parseFloat(rowFieldValue);
                        }
                    }
                    sampleValue[importFieldNames[j]] = rowFieldValue;
                }
                singlePaddockSoils.push(sampleValue);
            }
            var singlePaddockSoil = {};
            singlePaddock.soils = setSoilSamplResult(singlePaddock.soils, singlePaddockSoils);
            currentPaddocks[i] = singlePaddock;
        }
        farmData.dateLastUpdated = newSampleResults.dateLastUpdated;
        farmData.soils = currentSoils;
        farmData.paddocks = currentPaddocks;
        return farmData;
    }
    soilSampleConverter.toFarmData = toFarmData;
    var setSoilSamplResult = function(currentPaddockSoil, singlePaddockSoilValue) {
        var paddockSoil = {};
        if (_isDefined(currentPaddockSoil)) {
            paddockSoil = currentPaddockSoil;
        }
        paddockSoil.sampleResults = singlePaddockSoilValue;
        return paddockSoil;
    };
    return soilSampleConverter;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilSampleValidator", function($log, farmdata, validations) {
    var soilSampleValidator = {}, _isDefined = validations.isDefined, _isArray = validations.isArray;
    soilSampleValidator.isValidFarmDataWithSoilSample = function(farmData) {
        var soils = farmData.soils;
        if (!_isDefined(soils)) {
            return false;
        }
        var soilSampleResults = soils.sampleResults;
        if (!_isDefined(soilSampleResults)) {
            return false;
        }
        var dateLastUpdated = soilSampleResults.dateLastUpdated;
        if (!_isDefined(dateLastUpdated)) {
            return false;
        }
        var importFieldNames = soilSampleResults.importFieldNames;
        if (!_isDefined(importFieldNames)) {
            return false;
        }
        if (!_isDefined(farmData.paddocks)) {
            return false;
        }
        var paddocks = farmData.paddocks[0];
        if (!_isDefined(paddocks.soils)) {
            return false;
        }
        return true;
    };
    soilSampleValidator.isValidSoilSampleResult = function(soilSampleResult) {
        var results = soilSampleResult.results;
        if (!_isDefined(results)) {
            return false;
        }
        var columnHeaders = results.columnHeaders;
        if (!_isDefined(columnHeaders)) {
            return false;
        }
        var rowsData = results.rows;
        if (!_isDefined(rowsData)) {
            return false;
        }
        if (!_isDefined(soilSampleResult.importFieldDictionary)) {
            return false;
        }
        if (!_isDefined(soilSampleResult.paddockRowDictionary)) {
            return false;
        }
        var numberOfPaddocks = Object.keys(soilSampleResult.paddockRowDictionary).length;
        $log.info("numberOfPaddocks " + numberOfPaddocks);
        if (!(numberOfPaddocks > 0)) {
            return false;
        }
        var totalCSVColumns = columnHeaders.length;
        $log.info("Columns in the column headers key " + totalCSVColumns);
        for (var i = 0; i < rowsData.length; i++) {
            var singleRow = rowsData[i];
            if (singleRow.length != totalCSVColumns) {
                $log.error("The " + i + " row with paddick name " + singleRow[0] + " doesn't have required number of columns");
                return false;
            }
        }
        return true;
    };
    return soilSampleValidator;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("googleAnalyticsSoilSampleImporter", function($log, validations, googleAnalytics) {
    var googleAnalyticsSoilSampleImporter = {}, api = "farmbuild-soil-sample-importer", _isDefined = validations.isDefined;
    googleAnalyticsSoilSampleImporter.trackSoilSampleImporter = function(clientName) {
        if (!_isDefined(clientName)) {
            $log.error("client name is not specified");
            return;
        }
        $log.info("googleAnalyticsImporter.track clientName: %s", clientName);
        googleAnalytics.track(api, clientName);
    };
    return googleAnalyticsSoilSampleImporter;
});

angular.module("farmbuild.soilSampleImporter").constant("importFieldDefaults", {
    types: [ {
        name: "Sample Id",
        soilClassificationName: undefined,
        hasAverage: false
    }, {
        name: "Sample Name",
        soilClassificationName: undefined,
        hasAverage: false
    }, {
        name: "pH H2O (Water)",
        soilClassificationName: "pH H2O (Water)",
        hasAverage: true
    }, {
        name: "Olsen Phosphorus (mg/kg)",
        soilClassificationName: "Olsen Phosphorus (mg/kg)",
        hasAverage: true
    }, {
        name: "PBI",
        soilClassificationName: "PBI",
        hasAverage: true
    }, {
        name: "KCl 40 Sulphur (mg/kg)",
        soilClassificationName: "KCl 40 Sulphur (mg/kg)",
        hasAverage: true
    }, {
        name: "Colwell Phosphorus (mg/kg)",
        soilClassificationName: "Colwell Phosphorus (mg/kg)",
        hasAverage: true
    }, {
        name: "Colwell Potassium (mg/kg)",
        soilClassificationName: "Colwell Potassium (mg/kg)",
        hasAverage: true
    }, {
        name: "Exch Potassium (meq/100g)",
        soilClassificationName: "Exch Potassium (meq/100g)",
        hasAverage: true
    } ]
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importField", function($log, importFieldTypes, validations) {
    $log.info("importField ");
    var importField = {};
    importField.hasClassification = function(importFieldName) {
        var fieldType = importFieldTypes.byName(importFieldName);
        if (fieldType && fieldType.soilClassificationName) {
            return true;
        }
        return false;
    };
    importField.hasAverage = function(importFieldName) {
        var fieldType = importFieldTypes.byName(importFieldName);
        if (fieldType && fieldType.hasAverage) {
            return true;
        }
        return false;
    };
    importField.getPaddockGroupFields = function() {
        var result = [];
        var allImportFields = importFieldTypes.toArray();
        for (var i = 0; i < allImportFields.length; i++) {
            if (allImportFields[i].hasAverage) {
                result.push(allImportFields[i]);
            }
        }
        return result;
    };
    return importField;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importFieldTypes", function(collections, validations, importFieldDefaults, $log) {
    var importFieldTypes, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _isEmpty = validations.isEmpty, _isDefined = validations.isDefined, _types = angular.copy(importFieldDefaults.types);
    function _create(name) {
        var type = {
            name: name
        };
        return type;
    }
    function _validate(type) {
        $log.info("validating type  ...", type);
        var valid = !_isEmpty(type) && !_isEmpty(type.name);
        if (!valid) {
            $log.error("invalid type: %j", type);
        }
        return valid;
    }
    function _add(types, name) {
        var type = _create(name);
        $log.info("adding a type ...", type);
        if (!_validate(type)) {
            return undefined;
        }
        return collections.add(types, type);
    }
    importFieldTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        create: _create
    };
    return importFieldTypes;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importFieldSelector", function($log, farmdata, soilSampleConverter, importFieldTypes, collections, importFieldSelectionValidator) {
    $log.info("importFieldSelector ");
    var importFieldSelector = {}, _paddocks = [], _types = importFieldTypes.toArray();
    function _findPaddockWithName(paddocks, name) {
        for (var i = 0; i < paddocks.length; i++) {
            if (name.trim().toUpperCase() == paddocks[i].name.toUpperCase()) {
                return paddocks[i];
            }
        }
        return undefined;
    }
    importFieldSelector.createNew = function(myFarmData, columnHeaders, rows, paddockColumnIndex) {
        if (!importFieldSelectionValidator.validateCreateNew(columnHeaders, rows)) {
            return undefined;
        }
        if (paddockColumnIndex < 0 || paddockColumnIndex >= columnHeaders.length) {
            return undefined;
        }
        collections.add(columnHeaders, "Farm Paddock Name", paddockColumnIndex);
        for (var i = 0; i < rows.length; i++) {
            collections.add(rows[i], "", paddockColumnIndex);
        }
        _paddocks = myFarmData.paddocks;
        importFieldSelector.paddocks = _paddocks;
        var result = {
            dateLastUpdated: new Date(),
            results: {
                columnHeaders: columnHeaders,
                rows: rows
            },
            importFieldDictionary: {},
            paddockRowDictionary: {},
            paddockNameColumn: paddockColumnIndex
        };
        return result;
    };
    importFieldSelector.validate = importFieldSelectionValidator.validateImportFieldsDefinition;
    importFieldSelector.save = function(myFarmData, importFieldsSelection) {
        if (!importFieldSelectionValidator.validateImportFieldsDefinition(importFieldsSelection)) {
            return undefined;
        }
        for (var key in importFieldsSelection.paddockRowDictionary) {
            for (var i = 0; i < importFieldsSelection.paddockRowDictionary[key].length; i++) {
                var rowIndex = importFieldsSelection.paddockRowDictionary[key][i];
                importFieldsSelection.results.rows[rowIndex][importFieldsSelection.paddockNameColumn] = key;
            }
        }
        return soilSampleConverter.toFarmData(myFarmData, importFieldsSelection);
    };
    importFieldSelector.autoLinkPaddock = function(importFieldsSelection, linkColumnIndex) {
        var linkedCount = 0;
        if (linkColumnIndex == importFieldsSelection.paddockNameColumn) {
            return;
        }
        var mappedPaddock = Object.keys(importFieldsSelection.paddockRowDictionary);
        var mappedRowIndex = [];
        for (var i = 0; i < mappedPaddock.length; i++) {
            mappedRowIndex = mappedRowIndex.concat(importFieldsSelection.paddockRowDictionary[mappedPaddock[i]]);
        }
        for (var i = 0; i < importFieldsSelection.results.rows.length; i++) {
            if (mappedRowIndex.indexOf(i) < 0) {
                var paddock = _findPaddockWithName(_paddocks, importFieldsSelection.results.rows[i][linkColumnIndex]);
                if (paddock) {
                    this.connectRow(importFieldsSelection, paddock, i);
                    linkedCount++;
                }
            }
        }
        return linkedCount;
    };
    importFieldSelector.connectRow = function(importFieldsSelection, paddock, rowIndex) {
        if (!importFieldsSelection.paddockRowDictionary.hasOwnProperty(paddock.name)) {
            importFieldsSelection.paddockRowDictionary[paddock.name] = [];
        }
        collections.add(importFieldsSelection.paddockRowDictionary[paddock.name], rowIndex);
    };
    importFieldSelector.disconnectRow = function(importFieldsSelection, paddock, index) {
        if (importFieldsSelection.paddockRowDictionary.hasOwnProperty(paddock.name)) {
            collections.remove(importFieldsSelection.paddockRowDictionary[paddock.name], index);
        }
    };
    importFieldSelector.resetPaddockRowDictionary = function(paddockSelection) {
        paddockSelection.paddockRowDictionary = {};
        return paddockSelection;
    };
    importFieldSelector.classifyColumn = function(importFieldsSelection, classificationType, index) {
        importFieldsSelection.importFieldDictionary[classificationType.name] = index;
    };
    importFieldSelector.declassifyColumn = function(paddockSelection, classificationType, index) {
        delete paddockSelection.importFieldDictionary[classificationType.name];
    };
    importFieldSelector.types = _types;
    importFieldSelector.paddocks = _paddocks;
    return importFieldSelector;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("importFieldSelectionValidator", function($log, validations, importFieldTypes) {
    var importFieldSelectionValidator = {};
    function _isEmptyObject(obj) {
        var name;
        for (name in obj) {
            return false;
        }
        return true;
    }
    importFieldSelectionValidator.validateCreateNew = function(columnHeaders, rows) {
        if (!validations.isDefined(columnHeaders) || columnHeaders.length == 0) {
            $log.error("Soil import column headers must be a valid array");
            return false;
        }
        if (!validations.isDefined(rows) || rows.length == 0) {
            $log.error("Soil import data row must be a valid array");
            return false;
        }
        for (var i = 0; i < rows.length; i++) {
            var aRow = rows[i];
            if (aRow.length != columnHeaders.length) {
                return false;
            }
        }
        return true;
    };
    importFieldSelectionValidator.validateImportFieldsDefinition = function(importFieldsSelection) {
        if (validations.isEmpty(importFieldsSelection.paddockRowDictionary) || _isEmptyObject(importFieldsSelection.paddockRowDictionary)) {
            return false;
        }
        $log.info("importFieldTypes ", JSON.stringify(importFieldTypes.toArray()));
        if (importFieldTypes.toArray().length != Object.keys(importFieldsSelection.importFieldDictionary).length) {
            return false;
        }
        return true;
    };
    return importFieldSelectionValidator;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("paddockGroups", function($log, farmdata, validations, paddockGoupValidator, paddockSoilSampleRetriever) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, paddockGroups = {};
    var paddocksInPaddockGroup = function(farmData, paddockGroupName) {
        var paddockList = [];
        if (!paddockGoupValidator.farmDataHasPaddockGroups(farmData)) {
            return undefined;
        }
        var paddockGroups = farmData.paddockGroups;
        for (var i = 0; i < paddockGroups.length; i++) {
            var singleGroup = paddockGroups[i];
            if (singleGroup.name == paddockGroupName) {
                paddockList = singleGroup.paddocks;
                break;
            }
        }
        if (paddockList.length == 0) {
            return undefined;
        }
        return paddockList;
    };
    paddockGroups.paddocksInPaddockGroup = paddocksInPaddockGroup;
    var averageForPaddockGroup = function(farmData, paddockGroupName) {
        var groupPaddocks = paddockGroups.paddocksInPaddockGroup(farmData, paddockGroupName);
        if (!_isDefined(groupPaddocks) || !(groupPaddocks.length > 0)) {
            return undefined;
        }
        var allPaddockSoils = [];
        for (var i = 0; i < groupPaddocks.length; i++) {
            var soilsSamples = paddockSoilSampleRetriever.soilSamplesInPaddock(farmData, groupPaddocks[i]);
            if (!_isDefined(soilsSamples)) {
                continue;
            }
            allPaddockSoils = allPaddockSoils.concat(soilsSamples);
        }
        var soils = farmData.soils;
        if (!_isDefined(soils)) {
            return undefined;
        }
        var sampleResults = soils.sampleResults;
        if (!_isDefined(sampleResults)) {
            return undefined;
        }
        var importFields = sampleResults.importFieldNames;
        if (!_isDefined(importFields)) {
            return undefined;
        }
        var averageGroup = paddockSoilSampleRetriever.averagesForSoilSamples(importFields, allPaddockSoils);
        $log.info("allPaddockSoils " + +JSON.stringify(averageGroup, null, "  "));
        return averageGroup;
    };
    paddockGroups.averageForPaddockGroup = averageForPaddockGroup;
    return paddockGroups;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("paddockGoupValidator", function($log, farmdata, validations) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, paddockGoupValidator = {};
    paddockGoupValidator.farmDataHasPaddockGroups = function(farmData) {
        if (!_isDefined(farmData)) {
            return false;
        }
        if (!_isDefined(farmData.paddockGroups)) {
            return false;
        }
        var paddockGoups = farmData.paddockGroups;
        $log.info("paddockGroups length " + paddockGoups.length);
        if (!(paddockGoups.length > 0)) {
            return false;
        }
        return true;
    };
    return paddockGoupValidator;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("paddockSoilSampleRetriever", function($log, validations, importField) {
    var _isDefined = validations.isDefined, _isArray = validations.isArray, _isEmpty = validations.isEmpty, paddockSoilSampleRetriever = {};
    paddockSoilSampleRetriever.soilSamplesInPaddock = function(farmData, paddockName) {
        if (!_isDefined(farmData)) {
            $log.error("FarmData for soilSamplesInPaddock is invalid");
            return undefined;
        }
        var paddock = farmData.paddocks;
        $log.info("soilSamplesInPaddock main  " + paddock.length + "  paddock " + JSON.stringify(paddock, null, "  "));
        var singlePaddock, paddockSoil;
        for (var i = 0; i < paddock.length; i++) {
            singlePaddock = paddock[i];
            if (singlePaddock.name == paddockName) {
                paddockSoil = singlePaddock.soils;
                return paddockSoil.sampleResults;
            }
        }
        if (!_isDefined(paddockSoil) || !_isDefined(paddockSoil.sampleResults)) {
            return undefined;
        }
    };
    paddockSoilSampleRetriever.averagesForSoilSamples = function(importFieldNames, soilSamples) {
        if (!_isDefined(importFieldNames) || !(importFieldNames.length > 0)) {
            return undefined;
        }
        if (!_isDefined(soilSamples) || !(soilSamples.length > 0)) {
            return undefined;
        }
        var columnValues = {};
        for (var i = 0; i < soilSamples.length; i++) {
            var singelSoilSample = soilSamples[i];
            $log.info("singelSoilSample " + JSON.stringify(singelSoilSample, null, "  "));
            $log.info("importFieldNames " + JSON.stringify(importFieldNames, null, "  "));
            for (var j = 0; j < importFieldNames.length; j++) {
                var fieldValue = singelSoilSample[importFieldNames[j]];
                if (_isEmpty(fieldValue) || isNaN(fieldValue) || fieldValue == null) {
                    continue;
                }
                var singleColumn = columnValues[importFieldNames[j]];
                if (!_isDefined(singleColumn)) {
                    singleColumn = {
                        sum: 0,
                        count: 0
                    };
                }
                if (!importField.hasAverage(importFieldNames[j])) {
                    singleColumn = null;
                } else {
                    singleColumn.sum = singleColumn.sum + fieldValue;
                    singleColumn.count = singleColumn.count + 1;
                }
                columnValues[importFieldNames[j]] = singleColumn;
            }
        }
        var averageValues = {};
        for (var j = 0; j < importFieldNames.length; j++) {
            var singleColumn = columnValues[importFieldNames[j]];
            if (!_isDefined(singleColumn)) {
                continue;
            }
            if (singleColumn == null) {
                averageValues[importFieldNames[j]] = null;
            } else {
                averageValues[importFieldNames[j]] = singleColumn.sum / singleColumn.count;
            }
        }
        return averageValues;
    };
    paddockSoilSampleRetriever.averagesForPaddock = function(farmData, paddockName) {
        $log.info("averagesForPaddock");
        var soilSamples = paddockSoilSampleRetriever.soilSamplesInPaddock(farmData, paddockName);
        $log.info("soilSamples " + soilSamples);
        var soils = farmData.soils;
        if (!_isDefined(soils)) {
            return undefined;
        }
        var sampleResults = soils.sampleResults;
        if (!_isDefined(sampleResults)) {
            return undefined;
        }
        var importFields = sampleResults.importFieldNames;
        if (!_isDefined(importFields)) {
            return undefined;
        }
        $log.info("b4 ret");
        return paddockSoilSampleRetriever.averagesForSoilSamples(importFields, soilSamples);
    };
    return paddockSoilSampleRetriever;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilSampleImporterSession", function($log, farmdata, validations) {
    var soilSampleImporterSession = {}, _isDefined = validations.isDefined;
    function load() {
        var root = farmdata.session.find();
        if (!_isDefined(root)) {
            return undefined;
        }
        return root.soilSampleImporter;
    }
    soilSampleImporterSession.saveSection = function(section, value) {
        var loaded = load();
        if (!_isDefined(loaded)) {
            $log.error("Unable to find an existing farmData! please create then save.");
            return soilSampleImporterSession;
        }
        loaded[section] = value;
        return save(loaded);
    };
    function save(toSave) {
        var farmData = farmdata.session.find();
        if (!_isDefined(farmData)) {
            $log.error("Unable to find the farmData in the session!");
            return undefined;
        }
        farmData.dateLastUpdated = new Date();
        farmData.soilSampleImporter = toSave;
        farmdata.session.save(farmData);
        return toSave;
    }
    soilSampleImporterSession.save = save;
    soilSampleImporterSession.loadSection = function(section) {
        var loaded = load();
        return loaded ? loaded[section] : null;
    };
    soilSampleImporterSession.isLoadFlagSet = function(location) {
        var load = false;
        if (location.href.split("?").length > 1 && location.href.split("?")[1].indexOf("load") === 0) {
            load = location.href.split("?")[1].split("=")[1] === "true";
        }
        return load;
    };
    soilSampleImporterSession.find = function() {
        return farmdata.session.find();
    };
    soilSampleImporterSession.export = function(document, farmData) {
        return farmdata.session.export(document, save(farmData));
    };
    return soilSampleImporterSession;
});

angular.module("farmbuild.soilSampleImporter").constant("soilClassificationDefaults", {
    types: [ {
        name: "pH H2O (Water)",
        ranges: [ {
            name: [ "Very Acidic", "Acidic", "Slightly Acidic", "Neutral" ],
            min: [ undefined, 5.2, 5.5, 6.1 ],
            max: [ 5.2, 5.5, 6.1, undefined ],
            defaultColor: [ "#fffe03", "#96cf4c", "#96cf4c", "#aba3cc" ]
        } ]
    }, {
        name: "Olsen Phosphorus (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            min: [ undefined, 9, 14, 20, 27 ],
            max: [ 9, 14, 20, 27, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "PBI",
        ranges: [ {
            name: [ "Very Sandy", "Sand, Sandy Loams", "Sandy/Silty Loams", "Sandy/Silty Clay Loams", "Clay Loams", "Clay Loams & Clay", "Volcanic Clay & Peat" ],
            min: [ undefined, 15, 35, 70, 140, 280, 840 ],
            max: [ 15, 35, 70, 140, 280, 840, undefined ],
            defaultColor: [ undefined, undefined, undefined, undefined, undefined, undefined, undefined ]
        } ]
    }, {
        name: "KCl 40 Sulphur (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            min: [ undefined, 4.5, 7.5, 10.5, 14 ],
            max: [ 4.5, 7.5, 10.5, 14, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "Colwell Phosphorus (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ undefined ],
                max: [ 15 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 15, 23, 30, 41 ],
            max: [ 15, 23, 30, 41, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 15 ],
                max: [ 35 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 17, 26, 34, 47 ],
            max: [ 17, 26, 34, 47, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 35 ],
                max: [ 70 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 19, 30, 39, 53 ],
            max: [ 19, 30, 39, 53, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 70 ],
                max: [ 140 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 22, 35, 45, 61 ],
            max: [ 22, 35, 45, 61, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 140 ],
                max: [ 280 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 26, 42, 54, 74 ],
            max: [ 26, 42, 54, 74, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 280 ],
                max: [ 840 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 37, 58, 75, 102 ],
            max: [ 37, 58, 75, 102, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 840 ],
                max: [ undefined ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 50, 90, 120, 150 ],
            max: [ 50, 90, 120, 150, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "Colwell Potassium (mg/kg)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ undefined ],
                max: [ 35 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 70, 120, 170, 230 ],
            max: [ 70, 120, 170, 230, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 35 ],
                max: [ 70 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 80, 130, 190, 250 ],
            max: [ 80, 130, 190, 250, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 70 ],
                max: [ 280 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 90, 130, 190, 260 ],
            max: [ 90, 130, 190, 260, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 280 ],
                max: [ undefined ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, 100, 150, 220, 280 ],
            max: [ 100, 150, 220, 280, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    }, {
        name: "Exch Potassium (meq/100g)",
        ranges: [ {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ undefined ],
                max: [ 35 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .18, .31, .44, .6 ],
            max: [ .18, .31, .44, .6, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 35 ],
                max: [ 70 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .2, .33, .49, .64 ],
            max: [ .2, .33, .49, .64, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 70 ],
                max: [ 280 ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .23, .33, .53, .66 ],
            max: [ .23, .33, .53, .66, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        }, {
            name: [ "Deficient", "Marginal", "Adequate", "High", "Very High" ],
            dependencyRange: {
                name: [ "PBI" ],
                min: [ 280 ],
                max: [ undefined ],
                defaultColor: [ undefined ]
            },
            min: [ undefined, .26, .39, .56, .72 ],
            max: [ .26, .39, .56, .72, undefined ],
            defaultColor: [ "#fff6a6", "#98d6ea", "#9fba9b", "#ffbfdc", "#ff7573" ]
        } ]
    } ]
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilClassification", function($log, soilClassificationTypes, validations) {
    $log.info("soilClassification ");
    var soilClassification = {}, _isDefined = validations.isDefined;
    function _isWithinRange(min, max, classificationValue) {
        if (!_isDefined(min) && _isDefined(max)) {
            return classificationValue <= max;
        } else if (_isDefined(min) && _isDefined(max)) {
            return min < classificationValue && classificationValue <= max;
        } else if (_isDefined(min) && !_isDefined(max)) {
            return min < classificationValue;
        }
        return false;
    }
    function _findRangeIndex(minArray, maxArray, classificationValue) {
        for (var i = 0; i < minArray.length; i++) {
            if (_isWithinRange(minArray[i], maxArray[i], classificationValue)) {
                return i;
            }
        }
        return -1;
    }
    function _copyResult(classificationRange, index) {
        if (index >= 0 && index < classificationRange.name.length) {
            var result = {};
            result.name = classificationRange.name[index];
            result.min = classificationRange.min[index];
            result.max = classificationRange.max[index];
            result.defaultColor = classificationRange.defaultColor[index];
            return result;
        }
        return undefined;
    }
    function _isValidType(anObject) {
        try {
            if (_isDefined(anObject) && _isDefined(anObject.name) && _isDefined(anObject.ranges)) {
                return true;
            }
        } catch (err) {}
        return false;
    }
    soilClassification.findRange = function(classificationType, classificationValue) {
        if (!_isValidType(classificationType)) {
            return undefined;
        }
        for (var i = 0; i < classificationType.ranges.length; i++) {
            var aRange = classificationType.ranges[i];
            var index = _findRangeIndex(aRange.min, aRange.max, classificationValue);
            if (index >= 0) {
                return _copyResult(aRange, index);
            }
        }
        return undefined;
    };
    soilClassification.findRangeWithDependency = function(classificationType, classificationValue, dependencyValue) {
        if (!_isValidType(classificationType)) {
            return undefined;
        }
        for (var i = 0; i < classificationType.ranges.length; i++) {
            var aRange = classificationType.ranges[i];
            if (_findRangeIndex(aRange.dependencyRange.min, aRange.dependencyRange.max, dependencyValue) >= 0) {
                var index = _findRangeIndex(aRange.min, aRange.max, classificationValue);
                if (index >= 0) {
                    return _copyResult(aRange, index);
                }
                return undefined;
            }
        }
        return undefined;
    };
    soilClassification.classifyResult = function(sampleResult, key) {
        var type = soilClassificationTypes.byName(key);
        if (!type) {
            return undefined;
        }
        return soilClassification.findRange(type, sampleResult[key]);
    };
    return soilClassification;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").factory("soilClassificationTypes", function(collections, validations, soilClassificationDefaults, $log) {
    var soilClassificationTypes, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _isEmpty = validations.isEmpty, _isDefined = validations.isDefined, _types = angular.copy(soilClassificationDefaults.types);
    function _create(name) {
        var type = {
            name: name
        };
        return type;
    }
    function _validate(type) {
        $log.info("validating type  ...", type);
        var valid = !_isEmpty(type) && !_isEmpty(type.name);
        if (!valid) {
            $log.error("invalid type: %j", type);
        }
        return valid;
    }
    function _add(types, name) {
        var type = _create(name);
        $log.info("adding a type ...", type);
        if (!_validate(type)) {
            return undefined;
        }
        return collections.add(types, type);
    }
    soilClassificationTypes = {
        add: _add,
        at: function(index) {
            return collections.at(_types, index);
        },
        size: function() {
            return collections.size(_types);
        },
        byName: function(name) {
            return collections.byProperty(_types, "name", name);
        },
        toArray: function() {
            return angular.copy(_types);
        },
        removeAt: function(index) {
            return collections.removeAt(_types, index);
        },
        last: function() {
            return collections.last(_types);
        },
        validate: _validate,
        create: _create
    };
    return soilClassificationTypes;
});

"use strict";

angular.module("farmbuild.soilSampleImporter").run(function(soilSampleImporter) {});

angular.injector([ "ng", "farmbuild.soilSampleImporter" ]);