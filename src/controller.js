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
    if (window.innerWidth < 650) {
        $scope.mobileMode = true;
    }
    else {
        $scope.mobileMode = false;
    }

    $scope.layout.getScope = function () {
        return $scope;
    }


    $scope.$watch("layout.prop.columns", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            setupStyles().then(function () {
                createTrellisObjects();
            })
        }
    });

    $scope.$watch("mobileMode", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            setupStyles().then(function () {
                createTrellisObjects();
            })
        }
    });

    $scope.$watch("layout.prop.slideMode", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            setupStyles().then(function () {
                createTrellisObjects();
            })
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



    $scope.$watch("layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]", async function (newValue, oldValue) {
        if (!$scope.layout.prop.vizId) {
            $scope.showMasterVizSelect = true;
            $scope.masterVizs = await getMasterItems();
        }
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

    $scope.$watch("layout.prop.maxCharts", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            setupStyles().then(async function () {
                createTrellisObjects();
            })
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

    $scope.onMasterVizSelected = function (masterViz) {
        enigma.app.getObject($scope.layoutId).then(function (obj) {
            var params = {
                "qPatches": [
                    {
                        "qOp": 0,
                        "qPath": "/prop/vizId",
                        "qValue": `\"${masterViz}\"`
                    }
                ],
                "qSoftPatch": false
            };
            obj.applyPatches(params).then(function () {
                $scope.showMasterVizSelect = false;
            })
        })
    }

    $scope.prevSlide = function () {
        $scope.$watch(function () {
            $scope.slideIndex = $scope.slideIndex - 1;
            var dots = $(".qwik-trellis-dot");
            for (var i = 0; i < dots.length; i++) {
                if ($scope.slideIndex == i) {
                    $(dots[i]).addClass("qwik-trellis-active");
                }
                else {
                    $(dots[i]).removeClass("qwik-trellis-active");
                }
            }
        })
        qlik.resize();
    }

    $scope.nextSlide = function () {
        $scope.$watch(function () {
            $scope.slideIndex = $scope.slideIndex + 1;
            var dots = $(".qwik-trellis-dot");
            for (var i = 0; i < dots.length; i++) {
                if ($scope.slideIndex == i) {
                    $(dots[i]).addClass("qwik-trellis-active");
                }
                else {
                    $(dots[i]).removeClass("qwik-trellis-active");
                }
            }
        })
        qlik.resize();
    }

    $scope.dotClick = function (index) {
        var dots = $(".qwik-trellis-dot");
        for (var i = 0; i < dots.length; i++) {
            console.log(index, i);
            if (index == i) {
                console.log('yes');
                $(dots[i]).addClass("qwik-trellis-active");
            }
            else {
                $(dots[i]).removeClass("qwik-trellis-active");
            }
        }
        $scope.$watch(function () {
            $scope.slideIndex = index;
        })
        qlik.resize();
    }

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
                            if (cube.length > parseInt($scope.layout.prop.maxCharts)) {
                                $scope.$watch(function () {
                                    $scope.showError = true;
                                    $scope.errorMsg = "Too many dimension values!";
                                    $scope.showCharts = false;
                                })
                                if ($scope.sessionIds.length > 0 && enigma && enigma.app) {
                                    for (var i = 0; i < $scope.sessionIds.length; i++) {
                                        enigma.app.destroySessionObject($scope.sessionIds[i]);
                                    }
                                }
                                reject("Too many dimension values!");
                            }
                            else {
                                resolve(cube);
                            }
                            resolve(cube);
                            enigma.app.destroySessionObject(reply.qInfo.qId);
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
                    $scope.qtProps = '';
                    for (var c = 0; c < chartTypes.length; c++) {
                        if ($scope.vizProp.qInfo.qType == chartTypes[c].name) {
                            $scope.qtProps = chartTypes[c];
                        }
                    }
                    // If not found, use default chart type
                    if (!$scope.qtProps) {
                        var def = chartTypes.filter(chart => chart.name == 'default');
                        $scope.qtProps = def[0];
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
                                    var promise = getAndSetMeasures($scope.vizProp, dimName, dimValue, $scope.qtProps.paths);
                                    propPromises.push(promise);
                                }
                            }
                            catch (err) {
                            }
                        }
                        Promise.all(propPromises).then(function (props) {
                            for (var q = 0; q < $scope.currentCube.length; q++) {
                                var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
                                var dimValue = $scope.currentCube[q][0].qText;
                                var promise = createChart(props[q], dimName, dimValue, q);
                                chartPromises.push(promise);
                            }
                            Promise.all(chartPromises).then(function (viz) {
                                if ($scope.qtProps.autoRange) {
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
                                                var dots = $(".qwik-trellis-dot");
                                                $(dots[0]).addClass("qwik-trellis-active");
                                                $scope.$watch(function () {
                                                    $scope.showCharts = true;
                                                    $scope.showError = false;
                                                    $scope.slideIndex = 0;
                                                })
                                                qlik.resize();
                                            })
                                        })
                                    })
                                }
                                else {
                                    var dots = $(".qwik-trellis-dot");
                                    $(dots[0]).addClass("qwik-trellis-active");
                                    $scope.$watch(function () {
                                        $scope.showCharts = true;
                                        $scope.showError = false;
                                        $scope.slideIndex = 0;
                                    })
                                    qlik.resize();
                                }
                            })
                        })
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

    function createMeasure(m, dimName, dimValue, showAll, type) {
        return new Promise(function (resolve, reject) {
            if (type == 'measureBased') {
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
                if ($scope.layout.prop.showAllDims == true && showAll == true) {
                    currentMes += " + 0*Sum({1}1)";
                }
                currentMes = currentMes.replaceAll('$(vDimSetFull)', "{<" + `[${dimName}]={'${dimValue}'}` + ">}");
                currentMes = currentMes.replaceAll('$(vDimSet)', `,[${dimName}]={'${dimValue}'}`);
                currentMes = currentMes.replaceAll('$(vDim)', `'${dimValue}'`);
                resolve(currentMes);
            }
            else {
                var d = m.replace(/=/g, "");
                var dimension = `=If([${dimName}] = '${dimValue}', ${d})`
                resolve(dimension);
            }
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

    async function getAndSetMeasures(vizProp, dimName, dimValue, paths) {
        return new Promise(async function (resolve, reject) {
            try {
                var prop = JSON.parse(JSON.stringify(vizProp));
                // Loop through paths
                for (var p = 0; p < paths.length; p++) {
                    // Does general check for path
                    if (eval('typeof ' + 'prop.' + paths[p].path1 + ' != "undefined"')) {
                        // Loop through first path
                        for (var path1 = 0; path1 < eval('prop.' + paths[p].path1 + '.length'); path1++) {
                            // check for multiple loops
                            if (paths[p].loopsCount == 1) {
                                // Make general check
                                try {
                                    eval('prop. ' + paths[p].generalCheck);
                                    // is lib item 
                                    if (eval('prop.' + paths[p].libCheck)) {
                                        // get lib item
                                        var measure = await getMasterMeasure(eval('prop.' + paths[p].libDef));
                                        // get modified measure
                                        var modMeasure = await createMeasure(measure, dimName, dimValue, paths[p].showAll, $scope.qtProps.type);
                                        // set modified measure
                                        eval('prop.' + paths[p].libDefMes);
                                        eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                    }
                                    // is not lib item
                                    else {
                                        // get measure
                                        var measure = eval('prop.' + paths[p].def);
                                        // get modified measure
                                        var modMeasure = await createMeasure(measure, dimName, dimValue, paths[p].showAll, $scope.qtProps.type);
                                        // set modified measure
                                        eval('prop.' + paths[p].libDefMes);
                                        eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                    }
                                }
                                catch (err) {
                                }
                            }
                            // Multiple loops
                            else {
                                // Check if path 2 exists
                                if (eval('typeof ' + 'prop.' + paths[p].path2 + '!= "undefined"')) {
                                    // Loop through number of loops
                                    for (var path2 = 0; path2 < eval('prop.' + paths[p].path2 + '.length'); path2++) {
                                        // Make general check
                                        try {
                                            eval('prop. ' + paths[p].generalCheck);
                                            // Check if lib item
                                            if (eval('prop.' + paths[p].libCheck)) {
                                                // get lib item
                                                var measure = await getMasterMeasure(eval(paths[p].libDef));
                                                // get modified measure
                                                var modMeasure = await createMeasure(measure, dimName, dimValue, paths[p].showAll, $scope.qtProps.type);
                                                // set modified measure
                                                eval('prop.' + paths[p].libDef + ' = ' + paths[p].libDefMes);
                                                eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                            }
                                            // Normal measure
                                            else {
                                                // get measure
                                                var measure = eval('prop.' + paths[p].def);
                                                // get modified measure
                                                var modMeasure = await createMeasure(measure, dimName, dimValue, paths[p].showAll, $scope.qtProps.type);

                                                // set modified measure
                                                eval('prop.' + paths[p].libDef + ' = ' + paths[p].libDefMes);
                                                eval('prop.' + paths[p].def + ' = ' + '"' + modMeasure + '"');
                                            }
                                        }
                                        catch (err) {
                                        }

                                    }

                                }
                            }
                        }
                    }
                }
                resolve(prop);
            }
            catch (err) {
                resolve(prop);
            }
        })
    }

    function getMasterItems() {
        return new Promise(function (resolve, reject) {
            app.getList('masterobject').then(function (model) {
                // Close the model to prevent any updates.
                app.destroySessionObject(model.layout.qInfo.qId);
                // This is a bit iffy, might be smarter to reject and handle empty lists on the props instead.
                if (!model.layout.qAppObjectList.qItems) return resolve({ value: '', label: 'No MasterObjects' });
                // Resolve an array with master objects.
                resolve(model.layout.qAppObjectList.qItems);
            });

        });
    };


    function createChart(vizProp, dimName, dimValue, i) {
        var props = JSON.parse(JSON.stringify(vizProp));
        return new Promise(function (resolve, reject) {
            try {
                if (!$scope.layout.prop.advanced) {
                    props.showTitles = true;
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
                    if (!$scope.layout.prop.slideMode && !$scope.mobileMode) {
                        var qwikCells = $('.qwik-trellis-cell');
                    }
                    else {
                        var qwikCells = $('.qwik-trellis-slide');
                    }

                    vis.show(qwikCells[i]).then(function (test) {

                        /* if ($scope.layout.prop.customTitle) {   
                            var customTitle = $scope.layout.prop.customTitle.replaceAll('vDim', dimName);
                            customTitle = customTitle.replaceAll('vDimValue', dimValue);
                            $('.qwik-trellis-cell').eq(i).prepend(customTitle);
                        } */
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