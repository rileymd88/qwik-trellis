var qlik = window.require('qlik');
import chartTypes from './chartTypes.js';
import $ from 'jquery';
import popoverTemplate from './popover.ng.html';

export default ['$scope', '$element', function ($scope, $element) {
  $scope.layoutId = $scope.layout.qInfo.qId;
  var enigma = $scope.component.model.enigmaModel;
  var app = qlik.currApp($scope);
  $scope.sessionIds = [];
  $scope.mobileMode = window.innerWidth < 650;

  $scope.layout.getScope = function () {
    return $scope;
  };

  function forbiddenVisualization(visualization) {
    return ['container', 'qlik-show-hide-container', 'qlik-tabbed-container', 'qlik-trellis-container'].indexOf(visualization) > -1;
  }

  $scope.$watch("layout.prop.columns", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("mobileMode", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("layout.prop.slideMode", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("layout.prop.maxCharts", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(async function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("layout.qStateName", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("sortCriterias", function (newValue, oldValue) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue) && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("nullSuppression", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  function isReadyToSetupStyles() {
    return typeof $scope.mobileMode !== 'undefined'
      && typeof $scope.sortCriterias !== 'undefined'
      && typeof $scope.nullSuppression !== 'undefined';
  }

  function setupStyles() {
    return new Promise(function (resolve, reject) {
      if (!$scope.layout.qHyperCube.qDimensionInfo[0]) {
        resolve();
      }

      // Create hypercube
      getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]).then(function (cube) {
        $scope.currentCube = cube;
        $scope.colNum = parseInt($scope.layout.prop.columns);
        if ($scope.currentCube) {
          if ($scope.currentCube.length < $scope.colNum) {
            $scope.colNum = $scope.currentCube.length;
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
      });
    });
  }

  $scope.$watch("layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]", async function (newValue, oldValue) {
    if (!$scope.layout.prop.vizId) {
      getMasterItems().then(function (items) {
        var supportedItems = items.filter(function (item) {
          return !forbiddenVisualization(item.qData.visualization);
        });
        $scope.masterVizs = supportedItems;
        $scope.showMasterVizSelect = true;
      });
    }
    if (newValue !== oldValue && $scope.layout.qHyperCube.qDimensionInfo[0]) {
      try {
        // Create hypercube
        getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]).then(function (cube) {
          $scope.currentCube = cube;
          createTrellisObjects();
        });
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
            enigma.app.destroySessionObject($scope.sessionIds[i]);
          }
          $scope.showCharts = false;
        }
      }
    }
  });

  $scope.$watch("layout.prop.vizId", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.showMasterVizSelect = false;
      createTrellisObjects();
    }
  });

  $scope.$watch("layout.prop.advanced", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      createTrellisObjects();
    }
  });
  $scope.showAddMasterItemsDialog = function (event) {
    var items = $scope.masterVizs;
    var popover = qvangularGlobal.getService("luiPopover").show({
      template: popoverTemplate,
      alignTo: event.target,
      closeOnEscape: true,
      input: {
        items: items,
        onClick: function (item) {
          try {
            $scope.onMasterVizSelected(item.qInfo.qId);
          }
          finally {
            popover.close();
          }
        }
      }
    });
  };


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
            "qValue": `"${masterViz}"`
          }
        ],
        "qSoftPatch": false
      };
      obj.applyPatches(params).then(function () {
        $scope.showMasterVizSelect = false;
      });
    });
  };

  $scope.prevSlide = function () {
    $scope.$watch(function () {
      $scope.slideIndex = $scope.slideIndex - 1;
      var dots = $element.find(".qlik-trellis-dot");
      for (var i = 0; i < dots.length; i++) {
        if ($scope.slideIndex == i) {
          $(dots[i]).addClass("qlik-trellis-active");
        }
        else {
          $(dots[i]).removeClass("qlik-trellis-active");
        }
      }
    });
    qlik.resize();
  };

  $scope.nextSlide = function () {
    $scope.$watch(function () {
      $scope.slideIndex = $scope.slideIndex + 1;
      var dots = $element.find(".qlik-trellis-dot");
      for (var i = 0; i < dots.length; i++) {
        if ($scope.slideIndex == i) {
          $(dots[i]).addClass("qlik-trellis-active");
        }
        else {
          $(dots[i]).removeClass("qlik-trellis-active");
        }
      }
    });
    qlik.resize();
  };

  function getCube(dimDef) {
    return new Promise(function (resolve, reject) {
      var dimDefMes = dimDef.replace('=', '');
      return app.createCube({
        "qDimensions": [{
          "qDef": {
            "qFieldDefs": [dimDef],
            "qSortCriterias": $scope.sortCriterias
          },
          "qNullSuppression": $scope.nullSuppression
        }],
        "qMeasures": [{
          "qDef": {
            "qDef": `Count({1}${dimDefMes})`,
            "qLabel": "dim"
          }
        }],
        "qSortCriterias": $scope.sortCriterias,
        "qInitialDataFetch": [{
          qHeight: 50,
          qWidth: 2
        }]
      }, function (reply) {
        var cube = [];
        var i;
        for (i = 0; i < reply.qHyperCube.qDataPages[0].qMatrix.length; i++) {
          cube.push(reply.qHyperCube.qDataPages[0].qMatrix[i]);
        }
        if (cube.length > parseInt($scope.layout.prop.maxCharts)) {
          $scope.$watch(function () {
            $scope.showError = true;
            $scope.errorMsg = "Too many dimension values!";
            $scope.showCharts = false;
          });
          if ($scope.sessionIds.length > 0 && enigma && enigma.app) {
            for (i = 0; i < $scope.sessionIds.length; i++) {
              enigma.app.destroySessionObject($scope.sessionIds[i]);
            }
          }
          throw Error("Too many dimension values!");
        } else {
          $scope.$watch(function () {
            $scope.showError = false;
            $scope.errorMsg = "";
            $scope.showCharts = true;
          });
        }
        resolve(cube);
        enigma.app.destroySessionObject(reply.qInfo.qId);
      });
    });
  }

  async function createTrellisObjects() {
    // Get viz object
    if ($scope.currentCube) {
      if ($scope.currentCube.length < $scope.colNum) {
        $scope.colNum = $scope.currentCube.length;
      }
      // Destroy existing session objects
      for (var i = 0; i < $scope.sessionIds.length; i++) {
        await enigma.app.destroySessionObject($scope.sessionIds[i]);
      }
      return enigma.app.getObject($scope.layout.prop.vizId).then(function (vizObject) {
        $scope.vizObject = vizObject;
        $scope.vizObject.getProperties().then(async function (vizProp) {
          // Modify properties of master item viz
          $scope.vizProp = JSON.parse(JSON.stringify(vizProp));
          $scope.vizProp.qInfo.qId = "";
          $scope.vizProp.qInfo.qType = $scope.vizProp.visualization;
          $scope.qtcProps = $scope.vizProp.qInfo.qType in chartTypes
            ? chartTypes[$scope.vizProp.qInfo.qType] : chartTypes['default'];
          $scope.sessionIds = [];
          var objects = "";
          let propPromises = [];
          for (var q = 0; q < $scope.currentCube.length; q++) {
            var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
            var dimValue = $scope.currentCube[q][0].qText;
            if ($scope.qtcProps) {
              var promise = getAndSetMeasures($scope.vizProp, dimName, dimValue, $scope.qtcProps);
              propPromises.push(promise);
            }
          }

          return Promise.all(propPromises).then(function (props) {
            let chartPromises = [];
            for (var q = 0; q < $scope.currentCube.length; q++) {
              var dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
              var dimValue = $scope.currentCube[q][0].qText;
              var promise = createChart(props[q], dimName, dimValue, q);
              chartPromises.push(promise);
            }

            return Promise.all(chartPromises).then(async function (viz) {
              if ($scope.qtcProps.autoRange) {
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

                // If combochart then add extra step to get data from each chart to set $scope.max
                if($scope.vizProp.qInfo.qType == 'combochart') {
                  let values = [];
                  let axisMap = [];
                  for(let mc = 0; mc < $scope.vizProp.qHyperCubeDef.qMeasures.length;mc++) {
                    axisMap.push({ 
                      "measure": mc + 1, 
                      "axis": $scope.vizProp.qHyperCubeDef.qMeasures[mc].qDef.series.axis 
                    });
                  }
                  for(var o = 0; o < viz.length;o++) {
                    try {
                      let object = await enigma.app.getObject(viz[o].id);
                      let params = {
                        "qPath": "/qHyperCubeDef",
                        "qPages": [
                          {
                            "qLeft": 0,
                            "qTop": 0,
                            "qWidth": 10,
                            "qHeight": 1000
                          }
                        ]
                      };
                      let hypercube = await object.getHyperCubeData(params);
                      for(let h = 0; h < hypercube.length;h++) {
                        for(let m = 0; m < hypercube[h].qMatrix.length; m++) {
                          for(let r = 0; r < hypercube[h].qMatrix[m].length; r++) {
                            if(r != 0) {
                              let axisNumber = axisMap.filter(({ measure }) => measure == r);
                              values.push({ "axis": axisNumber[0].axis, "value": hypercube[h].qMatrix[m][r].qNum });
                            }
                          }
                        }
                      }
                    }
                    catch(err) {
                      // eslint-disable-next-line no-console
                      console.log(err);
                    }
                  }
                  let axis1 = values.filter(({ axis }) => axis == 0);
                  $scope.maxAxis1 = Math.max.apply(Math, axis1.map(function(v) { return v.value * 1.1; }));
                  let axis2 = values.filter(({ axis }) => axis == 1);
                  $scope.maxAxis2 = Math.max.apply(Math, axis2.map(function(v) { return v.value * 1.1; }));
                }

                let objectPromises = [];
                for (var x = 0; x < $scope.sessionIds.length; x++) {
                  var promise = enigma.app.getObject($scope.sessionIds[x]);
                  objectPromises.push(promise);
                }

                return Promise.all(objectPromises).then(function (obj) {
                  objects = obj;
                  let propPromises = [];
                  for (var ob = 0; ob < objects.length; ob++) {
                    var promise = objects[ob].getProperties();
                    propPromises.push(promise);
                  }

                  return Promise.all(propPromises).then(function (propPromise) {
                    let setPropPromises = [];
                    for (var p = 0; p < propPromise.length; p++) {
                      var props = JSON.parse(JSON.stringify(propPromise[p]));
                      if ($scope.layout.prop.autoRange && props.measureAxis) {
                        props.measureAxis.autoMinMax = false;
                        props.measureAxis.minMax = "max";
                        props.measureAxis.max = Math.round($scope.max * 1.1);
                        var promise = objects[p].setProperties(props);
                        setPropPromises.push(promise);
                      }
                      if($scope.layout.prop.autoRange && props.qInfo.qType == 'combochart') {
                        props.measureAxes[0].autoMinMax = false;
                        props.measureAxes[0].minMax = "max";
                        props.measureAxes[0].max = $scope.maxAxis1;
                        props.measureAxes[1].autoMinMax = false;
                        props.measureAxes[1].minMax = "max";
                        props.measureAxes[1].max = $scope.maxAxis2;
                        var comboPromise = objects[p].setProperties(props);
                        setPropPromises.push(comboPromise);
                      }
                    }

                    return Promise.all(setPropPromises).then(function () {
                      var dots = $element.find(".qlik-trellis-dot");
                      $(dots[0]).addClass("qlik-trellis-active");
                      $scope.$watch(function () {
                        $scope.showCharts = true;
                        $scope.showError = false;
                        $scope.slideIndex = 0;
                      });
                      qlik.resize();
                      return showCharts(viz);
                    });
                  });
                });
              }
              else {
                var dots = $element.find(".qlik-trellis-dot");
                $(dots[0]).addClass("qlik-trellis-active");
                $scope.$watch(function () {
                  $scope.showCharts = true;
                  $scope.showError = false;
                  $scope.slideIndex = 0;
                });
                qlik.resize();
                return showCharts(viz);
              }
            });
          });
        });
      });
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
          var form = '';
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
              var next = s + 1;
              // ensure not last item
              if (split[next]) {
                // check if includes < and inject partial set
                if (split[next].indexOf('{<') != -1) {
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
        if ($scope.layout.prop.showAllDims && showAll) {
          currentMes += " + 0*Sum({1}1)";
        }
        currentMes = currentMes.replaceAll('$(vDimSetFull)', "{<" + `[${dimName}]={'${dimValue}'}` + ">}");
        currentMes = currentMes.replaceAll('$(vDimSet)', `,[${dimName}]={'${dimValue}'}`);
        currentMes = currentMes.replaceAll('$(vDim)', `'${dimValue}'`);
        resolve(currentMes);
      }
      else {
        var d = m.replace(/=/g, "");
        var dimension = `=If([${dimName}] = '${dimValue}', ${d})`;
        resolve(dimension);
      }
    });
  }

  function getMasterMeasure(masterItemIdPath) {
    return new Promise(function (resolve, reject) {
      try {
        enigma.app.getMeasure(masterItemIdPath).then(function (mesObject) {
          resolve(mesObject);
        });
      }
      catch (err) {
        reject(err);
      }
    });
  }

  async function getAndSetMeasures(vizProp, dimName, dimValue, chartTypeProps) {
    const paths = chartTypeProps.paths;
    const showAll = chartTypeProps.showAll;
    return new Promise(async function (resolve, reject) {
      var props = JSON.parse(JSON.stringify(vizProp)); // Copies the property-object
      try {
        // Loop through paths
        for (let p = 0; p < paths.length; p++) {
          let path = paths[p];
          if (path.path1(props)) {
            // Loop through first path
            for (let i = 0; i < path.path1(props).length; i++) {
              // check for multiple loops
              if (path.loopsCount == 1) {
                // Make general check
                if (!path.generalCheck(props, i)) {
                  // Nothing to do here
                  continue;
                }

                // is lib item 
                if (path.libCheck(props, i)) {
                  // get lib item
                  let m = await getMasterMeasure(path.libDef.get(props, i));
                  // get measure
                  let mes = await m.getMeasure();
                  // get measure definition
                  let measure = mes.qDef;
                  // get measure label
                  let measureLabel = mes.qLabel;
                  // eslint-disable-next-line no-console
                  // get modified measure
                  let modMeasure = await createMeasure(
                    measure, dimName, dimValue, showAll, $scope.qtcProps.type);
                  // get measure label  
                  // set modified measure
                  path.libDefMes(props, i);
                  path.def.set(props, i, modMeasure);
                  path.measureLabel(props, i, measureLabel);
                }
                // is not lib item
                else {
                  // get measure
                  let measure = path.def.get(props, i);
                  // get modified measure
                  let modMeasure = await createMeasure(
                    measure, dimName, dimValue, showAll, $scope.qtcProps.type);
                  // set modified measure
                  path.libDefMes(props, i);
                  path.def.set(props, i, modMeasure);
                }
              }
              // Multiple loops
              else {
                // Check if path 2 exists
                if (path.path2(props, i)) {
                  // Loop through number of loops
                  for (let j = 0; j < path.path2(props, i).length; j++) {
                    // Make general check
                    if (!path.generalCheck(props, i)) {
                      // Nothing to do here
                      continue;
                    }

                    // Check if lib item
                    if (path.libCheck(props, i, j)) {
                      // get lib item
                      let m = await getMasterMeasure(path.libDef.get(props, i));
                      // get measure
                      let mes = await m.getMeasure();
                      // get measure definition
                      let measure = mes.qDef;
                      // get modified measure
                      let modMeasure = await createMeasure(
                        measure, dimName, dimValue, showAll, $scope.qtcProps.type);
                      // set modified measure
                      path.libDef.set(props, i, j, path.libDefMes(props, i, j));
                      path.def.set(props, i, j, modMeasure);
                    }
                    // Normal measure
                    else {
                      // get measure
                      let measure = path.def.get(props, i, j);
                      // get modified measure
                      let modMeasure = await createMeasure(
                        measure, dimName, dimValue, showAll, $scope.qtcProps.type);
                      // set modified measure
                      path.libDef.set(props, i, j, path.libDefMes(props, i, j));
                      path.def.set(props, i, j, modMeasure);
                    }
                  }
                }
              }
            }
          }
        }
        resolve(props);
      }
      catch (err) {
        resolve(props);
      }
    });
  }

  function getMasterItems() {
    return new Promise(function (resolve, reject) {
      app.getList('masterobject').then(function (model) {
        // Close the model to prevent any updates.
        app.destroySessionObject(model.layout.qInfo.qId);
        // This is a bit iffy, might be smarter to reject and handle empty lists on the props instead.
        if (!model.layout.qAppObjectList.qItems) {
          return resolve({ value: '', label: 'No MasterObjects' });
        }
        // Resolve an array with master objects.        
        resolve(model.layout.qAppObjectList.qItems);
      });
    });
  }

  function createChart(vizProp, dimName, dimValue, i) {
    return new Promise(function (resolve, reject) {
      try {
        var propsString = JSON.stringify(vizProp);
        if ($scope.layout.prop.advanced) {
          propsString = propsString.replaceAll('$(vDimSetFull)', "{<" + `[${dimName}]={'${dimValue}'}` + ">}");
          propsString = propsString.replaceAll('$(vDimSet)', `,[${dimName}]={'${dimValue}'}`);
          propsString = propsString.replaceAll('$(vDim)', `'${dimName}'`);
          propsString = propsString.replaceAll('$(vDimValue)', `'${dimValue}'`);
        }
        var props = JSON.parse(propsString);
        props.showTitles = true;
        props.title = dimValue;
        // Auto Range
        if (props.measureAxis) {
          if ($scope.layout.prop.autoRange) {
            props.measureAxis.measureMax = $scope.maxAxis;
            props.measureAxis.autoMinMax = false;
          }
        }
        // Dim Axis
        if (props.dimensionAxis) {
          if ($scope.layout.prop.label == 'left') {
            let leftCharts = [];
            let chartInt = 0;
            for (let v = 0; v < $scope.rowNum; v++) {
              if (v == 0) {
                leftCharts.push(chartInt);
              }
              else {
                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                leftCharts.push(chartInt);
              }
            }
            let label = false;
            for (let c = 0; c < leftCharts.length; c++) {
              if (i == leftCharts[c]) {
                label = true;
              }
            }
            if (!label) {
              props.dimensionAxis.show = 'none';
            }
          }
          if ($scope.layout.prop.label == 'right') {
            let rightCharts = [];
            let chartInt = $scope.colNum - 1;
            for (let v = 0; v < $scope.rowNum; v++) {
              if (v == 0) {
                rightCharts.push(chartInt);
              }
              else {
                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                rightCharts.push(chartInt);
              }
            }
            let label = false;
            for (let c = 0; c < rightCharts.length; c++) {
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
        if (props.measureAxis) {
          if ($scope.layout.prop.labelMes == 'left') {
            let leftCharts = [];
            let chartInt = 0;
            for (let v = 0; v < $scope.rowNum; v++) {
              if (v == 0) {
                leftCharts.push(chartInt);
              }
              else {
                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                leftCharts.push(chartInt);
              }
            }
            let label = false;
            for (let c = 0; c < leftCharts.length; c++) {
              if (i == leftCharts[c]) {
                label = true;
              }
            }
            if (!label) {
              props.measureAxis.show = 'none';
            }
          }
          if ($scope.layout.prop.labelMes == 'right') {
            let rightCharts = [];
            let chartInt = $scope.colNum - 1;
            for (let v = 0; v < $scope.rowNum; v++) {
              if (v == 0) {
                rightCharts.push(chartInt);
              }
              else {
                chartInt = parseInt(chartInt) + parseInt($scope.colNum);
                rightCharts.push(chartInt);
              }
            }
            let label = false;
            for (let c = 0; c < rightCharts.length; c++) {
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
        // Alternate State
        if (!props.qStateName) {
          // No qStateName on master object, so make it inherit qStateName of the trellis
          props.qStateName = $scope.layout.qStateName || '';
        }

        app.visualization.create(props.visualization, null, props).then(function (vis) {
          resolve(vis);
        });
      }
      catch (err) {
        reject(err);
      }
    });
  }

  function showCharts(viz) {
    var qwikCells = $scope.layout.prop.slideMode || $scope.mobileMode
      ? $element.find('.qlik-trellis-slide') : $element.find('.qlik-trellis-cell');
    var tasks = [];
    for (let i = 0; i < viz.length; i++) {
      tasks.push(viz[i].show(qwikCells[i]));
    }

    if (qwikCells.length > viz.length) {
      // Need to delete the content of the remaining cells
      for (let i = viz.length; i < qwikCells.length; i++) {
        // Just remove the element, the object has already been deleted before creating new
        $(qwikCells[i]).find(".qv-object-wrapper").remove();
      }
    }

    return Promise.all(tasks);
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
  };
}];