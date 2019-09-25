var qlik = window.require('qlik');
import chartTypes from './chartTypes.js';
import helper from './helper.js';
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

  $scope.$watch("layout.prop.columns", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("layout.qHyperCube.qDimensionInfo[0].calculatedDim", function (newValue, oldValue) {
    if (newValue !== oldValue && isReadyToSetupStyles()) {
      setupStyles().then(function () {
        createTrellisObjects();
      });
    }
  });

  $scope.$watch("layout.qHyperCube.qDimensionInfo[0].baseDim", function (newValue, oldValue) {
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

      $scope.setBorderProps();

      // Create hypercube
      let secondFieldDef;
      if ($scope.layout.qHyperCube.qDimensionInfo[1]) {
        secondFieldDef = $scope.layout.qHyperCube.qDimensionInfo[1].qGroupFieldDefs[0];
      }
      getCube($scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0], secondFieldDef).then(function (cube) {
        $scope.currentCube = cube;
        if (typeof secondFieldDef == 'undefined') {
          $scope.colNum = parseInt($scope.layout.prop.columns);
          if ($scope.currentCube) {
            if ($scope.currentCube.length < $scope.colNum) {
              $scope.colNum = $scope.currentCube.length;
            }
          }
          $scope.rowNum = Math.ceil($scope.currentCube.length / $scope.colNum);
        }
        else {
          let rowArray = cube.map(item => item[0].qText);
          let colArray = cube.map(item => item[1].qText);
          $scope.rowValues = [...new Set(rowArray.map(item => item))];
          $scope.colValues = [...new Set(colArray.map(item => item))];
          $scope.colNum = $scope.colValues.length;
          $scope.rowNum = $scope.rowValues.length;
        }
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
      helper.getMasterItems().then(function (items) {
        $scope.masterVizs = items;
        $scope.showMasterVizSelect = true;
      });
    }
    if (newValue !== oldValue && $scope.layout.qHyperCube.qDimensionInfo[0]) {
      try {
        setupStyles().then(function () {
          createTrellisObjects();
        });
      }
      catch (err) {
        // Destroy existing session objects
        destroyTrellisObjects();
      }
    }
  });

  $scope.$watch("layout.qHyperCube.qDimensionInfo[1].qGroupFieldDefs[0]", async function (newValue, oldValue) {
    if (newValue !== oldValue && $scope.layout.qHyperCube.qDimensionInfo[0]) {
      try {
        setupStyles().then(function () {
          createTrellisObjects();
        });
      }
      catch (err) {
        // Destroy existing session objects
        destroyTrellisObjects();
      }
    }
  });



  $scope.$watch("layout.prop.vizId", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      if (newValue) {
        $scope.showMasterVizSelect = false;
        createTrellisObjects();
      } else {
        $scope.showMasterVizSelect = true;
        destroyTrellisObjects();
      }
    }
  });

  $scope.$watch("layout.prop.advanced", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      createTrellisObjects();
    }
  });

  $scope.$watchCollection('[layout.prop.customTitle, layout.prop.customTitleColDef, layout.prop.customTitleRowDef, layout.prop.customValuesRowDef]', function () {
    try {
      $scope.customTitleColDef = JSON.parse($scope.layout.prop.customTitleColDef);
      $scope.customValuesColDef = JSON.parse($scope.layout.prop.customValuesColDef);
      $scope.customTitleRowDef = JSON.parse($scope.layout.prop.customTitleRowDef);
      $scope.customValuesRowDef = JSON.parse($scope.layout.prop.customValuesRowDef);
    }
    catch (err) {
      /* eslint-disable no-console */
      console.error("It looks like your custom tite properties are not formatted correctly!");
    }
  });

  $scope.showAddMasterItemsDialog = function (event) {
    var items = $scope.masterVizs;
    $scope.masterItemPopover = window.qvangularGlobal.getService("luiPopover").show({
      template: popoverTemplate,
      alignTo: event.target,
      closeOnEscape: true,
      closeOnOutside: true,
      input: {
        items: items,
        onClick: function (item) {
          try {
            if (item.value) {
              $scope.onMasterVizSelected(item.value);
            }
          }
          finally {
            $scope.masterItemPopover.close();
          }
        }
      }
    });
    $scope.masterItemPopover.closed.then(function () {
      $(window).off('resize.popover', $scope.onMasterItemPopoverResize);
    });
    $(window).on('resize.popover', $scope.onMasterItemPopoverResize);
  };

  $scope.onMasterItemPopoverResize = function () {
    if ($scope.masterItemPopover) {
      $scope.masterItemPopover.close();
    }
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

  $scope.$watch("layout.prop.border", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      if (newValue == true) {
        $scope.setBorderProps();
      }
      else {
        $scope.borderProps = {};
      }
    }
  });

  $scope.$watch("layout.prop.borderWidth", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.setBorderProps();
    }
  });

  $scope.$watch("layout.prop.borderColor.color", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.setBorderProps();
    }
  });

  $scope.$watch("layout.prop.borderStyle", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.setBorderProps();
    }
  });

  $scope.$watch("layout.prop.customBorderSwitch", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.setBorderProps();
    }
  });

  $scope.$watch("layout.prop.customBorder", function (newValue, oldValue) {
    if (newValue !== oldValue) {
      $scope.setBorderProps();
    }
  });


  $scope.setBorderProps = function() {
    if ($scope.layout.prop.customBorderSwitch) {
      try {
        $scope.borderProps = JSON.parse($scope.layout.prop.customBorder);
      }
      catch (err) {
        /* eslint-disable no-console */
        console.error(err);
      }
    }
    else {
      if ($scope.layout.prop.border) {
        $scope.borderProps = {
          "border": `${$scope.layout.prop.borderWidth}px`,
          "border-color": $scope.layout.prop.borderColor ? $scope.layout.prop.borderColor.color : $scope.layout.prop.borderColor,
          "border-style": $scope.layout.prop.borderStyle
        };
      }      
    }
  };

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

  function getCube(dimDef, dimDef2) {
    return new Promise(function (resolve, reject) {
      let params = {
        "qDimensions": [{
          "qDef": {
            "qFieldDefs": [dimDef],
            "qSortCriterias": $scope.sortCriterias
          },
          "qNullSuppression": $scope.nullSuppression
        }],
        "qSortCriterias": $scope.sortCriterias,
        "qInitialDataFetch": [{
          qHeight: 500,
          qWidth: 2
        }]
      };
      if (typeof dimDef2 != 'undefined') {
        let secondDimParam = {
          "qDef": {
            "qFieldDefs": [dimDef2],
            "qSortCriterias": $scope.sortCriterias
          },
          "qNullSuppression": $scope.nullSuppression
        };
        params.qDimensions.push(secondDimParam);
      }
      return app.createCube(params, function (reply) {
        var cube = [];
        var i;
        for (i = 0; i < reply.qHyperCube.qDataPages[0].qMatrix.length; i++) {
          cube.push(reply.qHyperCube.qDataPages[0].qMatrix[i]);
        }
        if (cube.length > parseInt($scope.layout.prop.maxCharts)) {
          $scope.showError = true;
          $scope.errorMsg = "Too many dimension values!";
          destroyTrellisObjects();
          throw Error("Too many dimension values!");
        } else {
          $scope.showError = false;
          $scope.errorMsg = "";
          $scope.showCharts = true;
        }
        resolve(cube);
        enigma.app.destroySessionObject(reply.qInfo.qId);
      });
    });
  }

  function destroyTrellisObjects() {
    if ($scope.sessionIds.length) {
      for (var i = 0; i < $scope.sessionIds.length; i++) {
        enigma.app.destroySessionObject($scope.sessionIds[i]);
      }
      $scope.showCharts = false;
    }
  }

  async function createTrellisObjects() {
    // Get viz object
    if ($scope.currentCube && $scope.layout && $scope.layout.prop && $scope.layout.prop.vizId) {
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
            let dimName;
            if ($scope.layout.qHyperCube.qDimensionInfo[0].calculatedDim) {
              dimName = $scope.layout.qHyperCube.qDimensionInfo[0].baseDim;
            }
            else {
              dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
            }
            let dimValue = $scope.currentCube[q][0].qText;
            let dimName2;
            let dimValue2;
            if ($scope.layout.qHyperCube.qDimensionInfo[1]) {
              if ($scope.layout.qHyperCube.qDimensionInfo[1].calculatedDim) {
                dimName2 = $scope.layout.qHyperCube.qDimensionInfo[1].baseDim;
              }
              else {
                dimName2 = $scope.layout.qHyperCube.qDimensionInfo[1].qGroupFieldDefs[0];
              }
              dimValue2 = $scope.currentCube[q][1].qText;
            }
            if ($scope.qtcProps && !$scope.layout.prop.advanced) {
              var promise = getAndSetMeasures($scope.vizProp, dimName, dimValue, dimName2, dimValue2, $scope.qtcProps);
              propPromises.push(promise);
            }
            else {
              propPromises.push($scope.vizProp);
            }
          }

          return Promise.all(propPromises).then(function (props) {
            let chartPromises = [];
            for (var q = 0; q < $scope.currentCube.length; q++) {
              let dimName;
              if ($scope.layout.qHyperCube.qDimensionInfo[0].calculatedDim) {
                dimName = $scope.layout.qHyperCube.qDimensionInfo[0].baseDim;
              }
              
              else {
                dimName = $scope.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0];
              }
              var dimValue = $scope.currentCube[q][0].qText;
              let dimName2;
              let dimValue2;
              if ($scope.layout.qHyperCube.qDimensionInfo[1]) {
                if ($scope.layout.qHyperCube.qDimensionInfo[1].calculatedDim) {
                  dimName2 = $scope.layout.qHyperCube.qDimensionInfo[1].baseDim;
                }
                else {
                  dimName2 = $scope.layout.qHyperCube.qDimensionInfo[1].qGroupFieldDefs[0];
                }                
                dimValue2 = $scope.currentCube[q][1].qText;
              }
              var promise = createChart(props[q], dimName, dimValue, dimName2, dimValue2, q);
              chartPromises.push(promise);
            }

            return Promise.all(chartPromises).then(function (viz) {
              for (var v = 0; v < viz.length; v++) {
                $scope.sessionIds.push(viz[v].id);
              }

              if ($scope.qtcProps.autoRange) {
                $scope.maxValues = [];
                for (var v = 0; v < viz.length; v++) {
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
                    return enigma.app.getUndoInfoObject().then(function (undoInfo) {
                      return undoInfo.startGroup().then(function (undoGroupId) {
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
                        }

                        return Promise.all(setPropPromises).then(function () {
                          var dots = $element.find(".qlik-trellis-dot");
                          $(dots[0]).addClass("qlik-trellis-active");
                          $scope.showCharts = true;
                          $scope.showError = false;
                          $scope.slideIndex = 0;
                          qlik.resize();
                          return showCharts(viz).then(function () {
                            return undoInfo.endGroup(undoGroupId);
                          });
                        });
                      });
                    });
                  });
                });
              } else {
                var dots = $element.find(".qlik-trellis-dot");
                $(dots[0]).addClass("qlik-trellis-active");
                $scope.showCharts = true;
                $scope.showError = false;
                $scope.slideIndex = 0;
                qlik.resize();
                return showCharts(viz);
              }
            });
          });
        });
      });
    }
  }

  function createMeasure(m, dimName, dimValue, dimName2, dimValue2, showAll, type) {
    /* eslint-disable no-console */
    return new Promise(function (resolve, reject) {
      if (type == 'measureBased') {
        var aggr = ["Sum", "Avg", "Count", "Min", "Max"];
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
          var aggrFunc = form.match(new RegExp(aggr[i], 'i'));
          var split = form.split(new RegExp(`${aggr[i]}\\(`, 'i'));
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
                  mes += split[s] + aggrFunc[0] + "($(vDimSet)";
                }
                // else inject full set
                else {
                  mes += split[s] + aggrFunc[0] + "($(vDimSetFull)";
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
        if (typeof dimName2 != 'undefined') {
          currentMes = currentMes.replaceAll('$(vDimSetFull)', `{<[${dimName}]={'${dimValue}'}, [${dimName2}]={'${dimValue2}'}>}`);
          currentMes = currentMes.replaceAll('$(vDimSet)', `,[${dimName}]={'${dimValue}'}, [${dimName2}]={'${dimValue2}'}`);
          currentMes = currentMes.replaceAll('$(vDim)', `'${dimValue}'`);
        }
        else {
          currentMes = currentMes.replaceAll('$(vDimSetFull)', "{<" + `[${dimName}]={'${dimValue}'}` + ">}");
          currentMes = currentMes.replaceAll('$(vDimSet)', `,[${dimName}]={'${dimValue}'}`);
          currentMes = currentMes.replaceAll('$(vDim)', `'${dimValue}'`);
        }
        resolve(currentMes);
      }
      else {
        var d = m.replace(/=/g, "");
        let dimension;
        if (typeof dimName2 != 'undefined') {
          dimension = `=If([${dimName}] = '${dimValue}' and [${dimName2}] = '${dimValue2}, ${d})`;
        }
        else {
          dimension = `=If([${dimName}] = '${dimValue}', ${d})`;
        }
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

  async function getAndSetMeasures(vizProp, dimName, dimValue, dimName2, dimValue2, chartTypeProps) {
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
                  let mes = await m.getMeasure();
                  let measure = mes.qDef;
                  let measureLabel = mes.qLabel;
                  // get modified measure
                  let modMeasure = await createMeasure(
                    measure, dimName, dimValue, dimName2, dimValue2, showAll, $scope.qtcProps.type);
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
                    measure, dimName, dimValue, dimName2, dimValue2, showAll, $scope.qtcProps.type);
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
                      let mes = await m.getMeasure();
                      let measure = mes.qDef;
                      let measureLabel = mes.qLabel;
                      // get modified measure
                      let modMeasure = await createMeasure(measure, dimName, dimValue, dimName2, dimValue2, showAll, $scope.qtcProps.type);
                      // set modified measure
                      path.libDef.set(props, i, j, path.libDefMes(props, i, j));
                      path.def.set(props, i, j, modMeasure);
                      path.measureLabel(props, i, j, modMeasure);
                    }
                    // Normal measure
                    else {
                      // get measure
                      let measure = path.def.get(props, i, j);
                      // get modified measure
                      let modMeasure = await createMeasure(measure, dimName, dimValue, dimName2, dimValue2, showAll, $scope.qtcProps.type);
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

  function createChart(vizProp, dimName, dimValue, dimName2, dimValue2, i) {
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
        if (typeof dimName2 == 'undefined' || $scope.layout.prop.slideMode || $scope.mobileMode) {
          props.title = dimValue;
        }
        else {
          props.showTitles = false;
          try {
            $scope.customTitleColDef = JSON.parse($scope.layout.prop.customTitleColDef);
            $scope.customValuesColDef = JSON.parse($scope.layout.prop.customValuesColDef);
            $scope.customTitleRowDef = JSON.parse($scope.layout.prop.customTitleRowDef);
            $scope.customValuesRowDef = JSON.parse($scope.layout.prop.customValuesRowDef);
          }
          catch (err) {
            throw Error("It looks like your custom tite properties are not formatted correctly!");
          }
        }

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
    var trellisCells = $scope.layout.prop.slideMode || $scope.mobileMode
      ? $element.find('.qlik-trellis-slide') : $element.find('.qlik-trellis-cell');
    var tasks = [];
    for (let i = 0; i < viz.length; i++) {
      tasks.push(viz[i].show(trellisCells[i]));
    }

    if (trellisCells.length > viz.length) {
      // Need to delete the content of the remaining cells
      for (let i = viz.length; i < trellisCells.length; i++) {
        // Just remove the element, the object has already been deleted before creating new
        $(trellisCells[i]).find(".qv-object-wrapper").remove();
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