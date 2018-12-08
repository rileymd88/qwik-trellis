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

  var myTextBox = {
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

  var colNum = {
    ref: "prop.columns",
    label: "Number of Columns",
    type: "string",
    expression: "optional",
    defaultValue: "4"
  };


  var linkSection = {
    // not necessary to define the type, component "expandable-items" will automatically
    // default to "items"
    // type: "items"
    component: "expandable-items",
    label: "Options",
    items: {
        header1: {
            type: "items",
            label: "Vizualisation Selection",
            items: {
                link: myTextBox,
                col: colNum
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