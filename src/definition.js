var qlik = window.require('qlik');


define([], function () {

  var dimensions = {
    uses: "dimensions",
    min: 0,
    max: 1
};

  var myTextBox = {
    ref: "prop.vizId",
    label: "Base Vizualisation",
    type: "string",
    expression: "optional",
    defaultValue: ""
  };

  function get(appId) {
    return new Promise(function(resolve, reject){
      $.get(baseUrl + '/links/', function (data) {
        return resolve(data.map(function (item) {
          return {
            value: item.id,
            label: item.name
          };
        }));
      })
    })
  }

  /* var link = {
    ref: "prop.link",
    label: "Select Link",
    type: "string",
    component: "dropdown",
    options: 
      getLinks().then(function(list){
        return list;
      }) 
    
  }; */


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
                link: myTextBox
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