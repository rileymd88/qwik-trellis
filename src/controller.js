var qlik = window.require('qlik');
import chartTypes from './chartTypes.js';

export default ['$scope', '$element', function ($scope, $element) {
    $scope.layoutId = $scope.layout.qInfo.qId;
    var enigma = $scope.component.model.enigmaModel;
    var app = qlik.currApp($scope);
    $scope.sessionIds = [];
    setupStyles().then(function () {
        createTrellisObjects();
    })
    $scope.$watch("layout.prop.columns", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.colNum = parseInt($scope.layout.prop.columns);
            if ($scope.currentCube) {
                if ($scope.currentCube.length < $scope.colNum) {
                    $scope.colNum = $scope.currentCube.length - 1;
                }
            }
            $scope.rowNum = Math.ceil($scope.currentCube.qDataPages[0].qMatrix.length / $scope.colNum);
            var rowPercent = 100 / $scope.rowNum;
            var px = $scope.rowNum + 1;
            rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' + px.toString() + 'px)';
            $scope.rowHeight = {
                "height": rowPercent
            };
            createTrellisObjects();
        }
    });

    function setupStyles() {
        return new Promise(function (resolve, reject) {
            // Create hypercube
            getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]).then(function (cube) {
                $scope.currentCube = cube;
                $scope.colNum = parseInt($scope.layout.prop.columns);
                if ($scope.currentCube) {
                    if ($scope.currentCube.length < $scope.colNum) {
                        $scope.colNum = $scope.currentCube.length - 1;
                    }
                }
                $scope.rowNum = Math.ceil($scope.currentCube.length / $scope.colNum);
                var rowPercent = 100 / $scope.rowNum;
                var px = $scope.rowNum + 1;
                rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' + px.toString() + 'px)';
                $scope.rowHeight = {
                    "height": rowPercent
                };
                resolve();
            })
        })
    }

    $scope.$watch("layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            try {
                // Create hypercube
                getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]).then(function (cube) {
                    $scope.currentCube = cube;
                    createTrellisObjects();
                })
                $scope.rowNum = Math.ceil($scope.currentCube.length / $scope.colNum);
                var rowPercent = 100 / $scope.rowNum;
                var px = $scope.rowNum + 1;
                rowPercent = 'calc(' + rowPercent.toString() + '%' + ' - ' + px.toString() + 'px)';
                $scope.rowHeight = {
                    "height": rowPercent
                };
            }
            catch (err) {
                // Destroy existing session objects
                if ($scope.sessionIds.length) {
                    for (var i = 0; i < $scope.sessionIds.length; i++) {
                        enigma.app.destroySessionObject($scope.sessionIds[i]).then(function (res) {
                        });
                    }
                    $scope.showCharts = false;
                }
            }
        }
    });

    $scope.$watch("layout.qHyperCube.qDataPages[0].qMatrix[0][0].qText", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            try {
                // Create hypercube
                getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]).then(function (cube) {
                    $scope.currentCube = cube;
                    createTrellisObjects();
                })
            }
            catch (err) {
            }
        }
    });

    $scope.$watch("layout.prop.vizId", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.advanced", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.showAllDims", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.label", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.labelMes", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    $scope.$watch("layout.prop.autoRange", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            createTrellisObjects();
        }
    });

    function getCube(dimDef) {
        return new Promise(function (resolve, reject) {
            try {
                enigma.app.getObject($scope.layoutId).then(function (object) {
                    object.getFullPropertyTree().then(function (properties) {
                        var extProps = JSON.parse(JSON.stringify(properties));
                        var qSortCriterias = extProps.qProperty.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias;
                        var dimDefMes = dimDef.replace('=', '');
                        app.createCube({
                            "qDimensions": [{
                                "qDef": {
                                    "qFieldDefs": [dimDef],
                                    "qSortCriterias": qSortCriterias
                                }
                            }],
                            "qMeasures": [{
                                "qDef": {
                                    "qDef": `Count({1}${dimDefMes})`,
                                    "qLabel": "dim"
                                }
                            }],
                            "qSortCriterias": qSortCriterias,
                            "qInitialDataFetch": [{
                                qHeight: 50,
                                qWidth: 2
                            }]
                        }, function (reply) {
                            var cube = [];
                            for (var i = 0; i < reply.qHyperCube.qDataPages[0].qMatrix.length; i++) {
                                if (reply.qHyperCube.qDataPages[0].qMatrix[i][0].qText != "-") {
                                    cube.push(reply.qHyperCube.qDataPages[0].qMatrix[i]);
                                }
                            }
                            resolve(cube);
                            app.enigma.destroySessionObject(reply.qInfo.qId);
                        });
                    })
                })
            }
            catch (err) {
                reject(err);
            }

        })

    }

    async function createTrellisObjects() {
        // Get viz object
        if (typeof $scope.currentCube != 'undefined') {
            if ($scope.currentCube.length < $scope.colNum) {
                $scope.colNum = $scope.currentCube.length - 1;
            }
            // Destroy existing session objects
            for (var i = 0; i < $scope.sessionIds.length; i++) {
                await enigma.app.destroySessionObject($scope.sessionIds[i]);
            }
            enigma.app.getObject($scope.layout.prop.vizId).then(function (vizObject) {
                $scope.vizObject = vizObject;
                $scope.vizObject.getProperties().then(async function (vizProp) {
                    // Modify properties of master item viz

                    $scope.vizProp = JSON.parse(JSON.stringify(vizProp));
                    $scope.vizProp.qInfo.qId = "";
                    $scope.vizProp.qInfo.qType = $scope.vizProp.visualization;
                    for (var c = 0; c < chartTypes.length; c++) {
                        if ($scope.vizProp.qInfo.qType == chartTypes[c].name) {
                            $scope.qtProps = chartTypes[c];
                        }
                    }
                    $scope.sessionIds = [];
                    var chartPromises = [];
                    var propPromises = [];
                    var chartPromises = [];
                    var objectPromises = [];
                    var propPromises2 = [];
                    var setPropPromises = [];
                    var objects = "";
                    try {
                        for (var q = 0; q < $scope.currentCube.length; q++) {
                            try {
                                var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
                                var dimValue = $scope.currentCube[q][0].qText;
                                if (typeof $scope.qtProps != 'undefined') {
                                    getAndSetMeasures($scope.vizProp, dimName, dimValue, $scope.qtProps.paths);
                                }
                                else {
                                }
                            }
                            catch (err) {
                            }
                        }
                        /* Promise.all(propPromises).then(function (props) {
                            for (var q = 0; q < $scope.currentCube.length; q++) {
                                var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
                                var dimValue = $scope.currentCube[q][0].qText;
                                var promise = createChart(props[q], dimName, dimValue, q);
                                chartPromises.push(promise);
                            }
                            Promise.all(chartPromises).then(function (viz) {
                                $scope.maxValues = [];
                                for (var v = 0; v < viz.length; v++) {
                                    $scope.sessionIds.push(viz[v].id);
                                    for (var m = 0; m < viz[v].model.layout.qHyperCube.qMeasureInfo.length; m++) {
                                        $scope.maxValues.push(viz[v].model.layout.qHyperCube.qMeasureInfo[m].qMax);
                                    }
                                    $scope.max = 0;
                                    for (var t = 0; t < $scope.maxValues.length; t++) {
                                        if ($scope.maxValues[t] > $scope.max) {
                                            $scope.max = $scope.maxValues[t];
                                        }
                                    }
                                }

                                for (var x = 0; x < $scope.sessionIds.length; x++) {
                                    var promise = enigma.app.getObject($scope.sessionIds[x]);
                                    objectPromises.push(promise);
                                }


                                Promise.all(objectPromises).then(function (obj) {
                                    objects = obj;
                                    for (var ob = 0; ob < objects.length; ob++) {
                                        var promise = objects[ob].getProperties();
                                        propPromises2.push(promise);
                                    }
                                    Promise.all(propPromises2).then(function (propPromise) {
                                        for (var p = 0; p < propPromise.length; p++) {
                                            var props = JSON.parse(JSON.stringify(propPromise[p]));
                                            if ($scope.layout.prop.autoRange && typeof props.measureAxis != 'undefined') {
                                                props.measureAxis.autoMinMax = false;
                                                props.measureAxis.minMax = "max";
                                                props.measureAxis.max = Math.round($scope.max * 1.1);
                                                var promise = objects[p].setProperties(props);
                                                setPropPromises.push(promise);
                                            }
                                        }
                                        Promise.all(setPropPromises).then(function () {
                                            $scope.showCharts = true;
                                            qlik.resize();
                                        })
                                    })
                                })
                            })
                        }) */

                    }
                    catch (err) {
                        reject(err);
                    }

                })
            })
        }
        else {
        }
    }

    function createMeasure(m, dimName, dimValue) {
        return new Promise(function (resolve, reject) {
            var aggr = ["Sum(", "Avg(", "Count(", "Min(", "Max("];
            var currentMes = '';
            var formula = m;
            // Loop through all possible aggregation types
            for (var i = 0; i < aggr.length; i++) {
                var form = ''
                if (i == 0) {
                    form = formula;
                } else {
                    form = currentMes;
                }
                var mes = '';
                var split = form.split(aggr[i]);
                // Check to see if form contains aggr
                if (split.length != 1) {
                    // loop through split
                    for (var s = 0; s < split.length; s++) {
                        // check for set analysis in next
                        var next = s + 1
                        // ensure not last item
                        if (typeof split[next] != 'undefined') {
                            // check if includes < and inject partial set
                            if (split[next].includes('{<')) {
                                mes += split[s] + aggr[i] + "$(vDimSet)";
                            }
                            // else inject full set
                            else {
                                mes += split[s] + aggr[i] + "$(vDimSetFull)";
                            }
                        }
                        // Last item
                        else {
                            mes += split[s];
                        }
                    }
                    currentMes = mes;
                } else {
                    currentMes = form;
                }
            }
            if ($scope.layout.prop.showAllDims) {
                currentMes += " + 0*Sum({1}1)";
            }
            currentMes = currentMes.replaceAll('$(vDimSetFull)', "{<" + `${dimName}={'${dimValue}'}` + ">}");
            currentMes = currentMes.replaceAll('$(vDimSet)', `,${dimName}={'${dimValue}'}`);
            currentMes = currentMes.replaceAll('$(vDim)', `'${dimValue}'`);
            resolve(currentMes);
        })
    }

    function getMasterMeasure(masterItemIdPath, m) {
        return new Promise(function (resolve, reject) {
            try {
                enigma.app.getMeasure(masterItemIdPath).then(function (mesObject) {
                    mesObject.getMeasure().then(function (mes) {
                        resolve(mes.qDef);
                    })
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /* function getAndSetMeasures(vizProp, dimName, dimValue, paths) {
        var masterItemIdPath = paths.masterItemIdPath;
        var masterItemCheck = paths.masterItemCheck;
        var measurePath = paths.measurePath;
        var measureDefPath = paths.measureDefPath;
        var loop = paths.secondLoop;
        var measurePath2 = paths.measurePath2;
        var vizProp = JSON.parse(JSON.stringify(vizProp));
        return new Promise(function (resolve, reject) {
            try {
                if (eval('vizProp.' + measurePath + '.length') > 0) {
                    // Loop through measures
                    var promises = [];
                    for (var m = 0; m < eval('vizProp.' + measurePath + '.length'); m++) {
                        if (loop) {
                            for (var secondLoop = 0; secondLoop < eval('vizProp.' + measurePath2 + '.length'); secondLoop++) {
                                try {
                                    // Get Measure Definition from master item
                                    if (eval("vizProp." + masterItemCheck)) {
                                        var promise = getMasterMeasure(eval('vizProp.' + masterItemIdPath));
                                        promises.push(promise);
                                    }
                                    // Otherwise get the def from hypercube
                                    else {
                                        var promise = eval('vizProp.' + measureDefPath);
                                        promises.push(promise);
                                    }
                                }
                                catch (err) {
                                    promises.push("no action");
                                }
                            }
                        }
                        else {
                            try {
                                // Get Measure Definition from master item
                                if (eval("vizProp." + masterItemCheck)) {
                                    var promise = getMasterMeasure(eval('vizProp.' + masterItemIdPath));
                                    promises.push(promise);
                                }
                                // Otherwise get the def from hypercube
                                else {
                                    var promise = eval('vizProp.' + measureDefPath);
                                    promises.push(promise);
                                }
                            }
                            catch (err) {
                                promises.push("no action");
                            }
                        }


                    }
                    // All measures received from promises
                    Promise.all(promises).then(function (measures) {
                        // Create modifed measures
                        var mesPromises = [];
                        for (var m = 0; m < measures.length; m++) {
                            if (measures[m] != 'no action') {
                                var mesPromise = createMeasure(measures[m], dimName, dimValue)
                                mesPromises.push(mesPromise);
                            }
                            else {
                                mesPromises.push(measures[m]);
                            }

                        }
                        // Set measures within props
                        Promise.all(mesPromises).then(function (measures) {
                            for (var m = 0; m < eval('vizProp.' + measurePath + '.length'); m++) {
                                if (measures[m] != 'no action') {
                                    eval('vizProp.' + masterItemIdPath + " = '';");
                                    eval('vizProp.' + measureDefPath + " = measures[m];");
                                }
                            }
                            resolve(vizProp);
                        })
                    })
                }
                else {
                    resolve(vizProp);
                }
            }
            catch (err) {
                reject(err);
            }
        })
    } */

    async function getAndSetMeasures(vizProp, dimName, dimValue, paths) {
        try {
            var prop = JSON.parse(JSON.stringify(vizProp));
            // Loop through paths
            for (var p = 0; p < paths.length; p++) {
                // Check if first path exists
                if (eval('typeof ' + 'prop.' + paths[p].path1 + ' != "undefined"')) {
                    // Loop through first path
                    for (var path1 = 0; path1 < eval('prop.' + paths[p].path1 + '.length'); path1++) {
                        // check for multiple loops
                        if (paths[p].loopsCount == 1) {
                            // is lib item 
                            if (eval('prop.' + paths[p].libCheck)) {
                                // get lib item
                                var measure = await getMasterMeasure(eval('prop.' + paths[p].libDef));
                                // get modified measure
                                var modMeasure = await (createMeasure(measure, dimName, dimValue));
                                // set modified measure
                                eval('prop.' + paths[p].libDefMes);
                                eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                console.log(prop);
                            }
                            // is not lib item
                            else {
                                // get measure
                                var measure = eval('prop.' + paths[p].def);
                                // get modified measure
                                var modMeasure = await (createMeasure(measure, dimName, dimValue));
                                // set modified measure
                                eval('prop.' + paths[p].libDefMes);
                                eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                console.log(prop);
                            }
                        }
                        // Multiple loops
                        else {
                            // Check if path 2 exists
                            if (eval('typeof ' + 'prop.' + paths[p].path2 + '!= "undefined"')) {
                                // Loop through number of loops
                                for (var path2 = 0; path2 < eval('prop.' + paths[p].path2 + '.length'); path2++) {
                                    // Check if lib item
                                    if (eval('prop.' + paths[p].libCheck)) {
                                        // get lib item
                                        var measure = await getMasterMeasure(eval(paths[p].libDef));
                                        // get modified measure
                                        var modMeasure = await (createMeasure(measure, dimName, dimValue));
                                        // set modified measure
                                        eval('prop.' + paths[p].libDef + ' = ' + paths[p].libDefMes);
                                        eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                    }
                                    // Normal measure
                                    else {
                                        // get measure
                                        var measure = eval('prop.' + paths[p].def);
                                        // get modified measure
                                        var modMeasure = await (createMeasure(measure, dimName, dimValue));
                                        // set modified measure
                                        eval('prop.' + paths[p].libDef + ' = ' + paths[p].libDefMes);
                                        eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    function checkNested(obj /*, level1, level2, ... levelN*/) {
        var args = Array.prototype.slice.call(arguments, 1);

        for (var i = 0; i < args.length; i++) {
            if (!obj || !obj.hasOwnProperty(args[i])) {
                return false;
            }
            obj = obj[args[i]];
        }
        return true;
    }

    var test = { level1: { level2: { level3: 'level3' } } };

    checkNested(test, 'level1', 'level2', 'level3'); // true
    checkNested(test, 'level1', 'level2', 'foo'); // false


    function createChart(vizProp, dimName, dimValue, i) {
        var props = JSON.parse(JSON.stringify(vizProp));
        return new Promise(function (resolve, reject) {
            try {
                if (!$scope.layout.prop.advanced) {
                    props.showTitle = true;
                    props.title = dimValue;
                }
                else {

                    props = JSON.stringify($scope.vizProp);
                    props = props.replaceAll('$(vDimSetFull)', "{<" + `[${dimName}]={'${dimValue}'}` + ">}");
                    props = props.replaceAll('$(vDimSet)', `,[${dimName}]={'${dimValue}'}`);
                    props = props.replaceAll('$(vDim)', `'${dimName}'`);
                    props = props.replaceAll('$(vDimValue)', `'${dimValue}'`);
                    props = JSON.parse(props);
                }
                // Auto Range
                if (typeof props.measureAxis != 'undefined') {
                    if ($scope.layout.prop.autoRange) {
                        props.measureAxis.measureMax = $scope.maxAxis;
                        props.measureAxis.autoMinMax = false;
                    }
                }
                // Dim Axis
                if (typeof props.dimensionAxis != 'undefined') {
                    if ($scope.layout.prop.label == 'left') {
                        var leftCharts = [];
                        var chartInt = 0;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                leftCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                leftCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < leftCharts.length; c++) {
                            if (i == leftCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.label == 'right') {
                        var rightCharts = [];
                        var chartInt = $scope.colNum - 1;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                rightCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                rightCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < rightCharts.length; c++) {
                            if (i == rightCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.label == 'top') {
                        if (i >= $scope.colNum) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.label == 'bottom') {
                        if (i < $scope.colNum * $scope.rowNum - $scope.colNum) {
                            props.dimensionAxis.show = 'none';
                        }
                    }
                }
                // Mes Axis
                if (typeof props.measureAxis != 'undefined') {
                    if ($scope.layout.prop.labelMes == 'left') {
                        var leftCharts = [];
                        var chartInt = 0;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                leftCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                leftCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < leftCharts.length; c++) {
                            if (i == leftCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.measureAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.labelMes == 'right') {
                        var rightCharts = [];
                        var chartInt = $scope.colNum - 1;
                        for (var v = 0; v < $scope.rowNum; v++) {
                            if (v == 0) {
                                rightCharts.push(chartInt);
                            }
                            else {
                                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                                rightCharts.push(chartInt);
                            }
                        }
                        var label = false;
                        for (var c = 0; c < rightCharts.length; c++) {
                            if (i == rightCharts[c]) {
                                label = true;
                            }
                        }
                        if (!label) {
                            props.measureAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.labelMes == 'top') {
                        if (i >= $scope.colNum) {
                            props.measureAxis.show = 'none';
                        }
                    }
                    if ($scope.layout.prop.labelMes == 'bottom') {
                        if (i < $scope.colNum * $scope.rowNum - $scope.colNum) {
                            props.measureAxis.show = 'none';
                        }
                    }
                }

                app.visualization.create(props.visualization, null, props).then(function (vis) {
                    var viz = vis;
                    var qwikCells = $element[0].querySelectorAll('.qwik-trellis-cell');
                    vis.show(qwikCells[i]).then(function (test) {
                        resolve(viz);
                    });
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    String.prototype.replaceAll = function (searchStr, replaceStr) {
        var str = this;
        // no match exists in string?
        if (str.indexOf(searchStr) === -1) {
            // return string
            return str;
        }
        // replace and remove first match, and do another recursirve search/replace
        return (str.replace(searchStr, replaceStr)).replaceAll(searchStr, replaceStr);
    }
}]