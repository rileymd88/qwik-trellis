var qlik = window.require('qlik');


define([], function () {

  var dimensions = {
    uses: "dimensions",
    min: 0,
    max: 1
};

function getMasterItems() {
  return new Promise(function(resolve, reject) {
      var app = qlik.currApp();
      app.getList('masterobject').then(function(model) {
          // Close the model to prevent any updates.
          app.destroySessionObject(model.layout.qInfo.qId);

          // This is a bit iffy, might be smarter to reject and handle empty lists on the props instead.
          if(!model.layout.qAppObjectList.qItems) return resolve({value: '', label: 'No MasterObjects'});
          // Resolve an array with master objects.
          return resolve( model.layout.qAppObjectList.qItems.map(function(item) {
              return {
                  value: item.qInfo.qId,
                  label: item.qMeta.title
              };
          }) );

      });

  });
};

  var link = {
    ref: "prop.vizId",
    label: "Base Vizualisation",
    type: "string",
    component: "dropdown",
    options: function () {
      return getMasterItems().then(function (items) {
          return items;
      });
  }
  };

  var label = {
    ref: "prop.label",
    label: "Dimension Titles",
    type: "string",
    component: "dropdown",
    options: [
        {"value": "default", "label":"Chart Default"},
        {"value": "left", "label":"Left Side Only"},
        {"value": "right", "label":"Right Side Only"},
        {"value": "top", "label":"Top Only"},
        {"value": "bottom", "label":"Bottom Only"}
    ],
    defaultValue: "default"
  };

  var colNum = {
    ref: "prop.columns",
    label: "Number of Columns",
    type: "string",
    expression: "optional",
    defaultValue: "4"
  };

  var advanced = {
    ref: "prop.advanced",
    label: "Advanced Mode",
    component: 'switch',
    type: "boolean",
    options: [{
        value: false,
        label: "Off"
    }, {
        value: true,
        label: "On"
    }
    ],
    defaultValue: true
}

var showAllDimensionValues = {
    ref: "prop.showAllDims",
    label: "Show All Possible Dimensions",
    component: 'switch',
    type: "boolean",
    options: [{
        value: false,
        label: "No"
    }, {
        value: true,
        label: "Yes"
    }
    ],
    defaultValue: true
}

var advancedMsg1 =  {
    type: "string",
    component: "text",
    label: "When using advanced mode, you have the flexibility to choose where to insert set analysis and dimension values within the base master visualisation",
    show: function (d) {
        return d.prop.advanced;
      }
  }

  var advancedMsg2 =  {
    type: "string",
    component: "text",
    label:"$(vDimSetFull) will insert '{<dimensionName={'dimensionValue'}>}'",
    show: function (d) {
        return d.prop.advanced;
      }
  }

  var advancedMsg3 =  {
    type: "string",
    component: "text",
    label:"\n $(vDimSet) will insert 'dimensionName={'dimensionValue'},' ",
    show: function (d) {
        return d.prop.advanced;
      }
  }

  var advancedMsg4 =  {
    type: "string",
    component: "text",
    label:"\n $(vDim) will insert 'dimensionName'",
    show: function (d) {
        return d.prop.advanced;
      }
  }

  var advancedMsg5 =  {
    type: "string",
    component: "text",
    label: "\n $(vDimValue) will insert 'dimensionValue'",
    show: function (d) {
        return d.prop.advanced;
      }
  }



  var linkSection = {
    component: "expandable-items",
    label: "Options",
    items: {
        header1: {
            type: "items",
            label: "Qwik Trellis Options",
            items: {
                link: link,
                col: colNum,
                label: label,
                showAllDimensionValues: showAllDimensionValues,
                advanced: advanced,
                advancedMsg1: advancedMsg1,
                advancedMsg2: advancedMsg2,
                advancedMsg3: advancedMsg3,
                advancedMsg4: advancedMsg4,
                advancedMsg5: advancedMsg5
            }
        }
    }
  }


  return {
    type: "items",
    component: "accordion",
    items: {
      dimensions: dimensions,
      linkSection: linkSection
    }
  };
});