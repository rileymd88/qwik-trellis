define(['./helper'], function (helper) {
  var data = {
    uses: 'data',
    translation: "Common.Data",
    type: "items",
    items: {
      dimensions: {
        uses: "dimensions",
        disabledRef: '',
        min: 1,
        max: 1,
      },
      measures: {
        show: false,
        min: 0,
        max: 0
      }
    }
  };

  var sorting = {
    uses: "sorting"
  };

  var link = {
    ref: "prop.vizId",
    label: "Base visualization",
    type: "string",
    component: "dropdown",
    options: function () {
      return helper.getMasterItems();
    }
  };

  var label = {
    ref: "prop.label",
    label: "Dimension titles",
    type: "string",
    component: "dropdown",
    options: [
      { "value": "default", "label": "Chart default" },
      { "value": "left", "label": "Left side only" },
      { "value": "right", "label": "Right side only" },
      { "value": "top", "label": "Top only" },
      { "value": "bottom", "label": "Bottom only" }
    ],
    defaultValue: "default"
  };

  var labelMes = {
    ref: "prop.labelMes",
    label: "Measure titles",
    type: "string",
    component: "dropdown",
    options: [
      { "value": "default", "label": "Chart default" },
      { "value": "left", "label": "Left side only" },
      { "value": "right", "label": "Right side only" },
      { "value": "top", "label": "Top only" },
      { "value": "bottom", "label": "Bottom only" }
    ],
    defaultValue: "default"
  };

  var colNum = {
    ref: "prop.columns",
    label: "Number of columns",
    type: "string",
    expression: "optional",
    defaultValue: "4"
  };

  var maxCharts = {
    ref: "prop.maxCharts",
    label: "Maximum number of charts",
    type: "string",
    expression: "optional",
    defaultValue: "8"
  };

  var slideMode = {
    ref: "prop.slideMode",
    label: "Slide mode",
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
    defaultValue: false
  };


  var border = {
    ref: "prop.border",
    label: "Border",
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
    defaultValue: false
  };

  var borderWidth = {
    type: "number",
    component: "slider",
    label: "Border Width",
    ref: "prop.borderWidth",
    min: 0.25,
    max: 10,
    step: 0.25,
    defaultValue: 0.5,
    show: function (d) {
      return d.prop && d.prop.border && !d.prop.customBorderSwitch;
    }
  };

  var borderColor = {
    ref: "prop.borderColor",
    label: "Border Color",
    type: "object",
    component: "color-picker",
    defaultValue: {
      color: "#B6D7EA",
      index: "-1"
    },
    show: function (d) {
      return d.prop && d.prop.border && !d.prop.customBorderSwitch;
    }
  };

  var borderStyle = {
    ref: "prop.borderStyle",
    label: "Border Style",
    type: "string",
    component: "dropdown",
    options: [
      { "value": "dashed", "label": "Dashed" },
      { "value": "dotted", "label": "Dotted" },
      { "value": "solid", "label": "Solid" }
    ],
    defaultValue: "solid",
    show: function (d) {
      return d.prop && d.prop.border && !d.prop.customBorderSwitch;
    }
  };

  var customBorderSwitch = {
    ref: "prop.customBorderSwitch",
    label: "Custom Border",
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
    defaultValue: false,
    show: function (d) {
      return d.prop && d.prop.border;
    }
  };

  var customBorder = {
    ref: "prop.customBorder",
    label: "Custom Border Properties",
    type: "string",
    expression: "optional",
    defaultValue: `{"border": "0.5px","border-color": "#b0afae","border-style": "solid"}`,
    show: function (d) {
      return d.prop && d.prop.border && d.prop.customBorderSwitch;
    }
  };


  var autoRange = {
    ref: "prop.autoRange",
    label: "Auto range",
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
  };

  var showAllDimensionValues = {
    ref: "prop.showAllDims",
    label: "Show all possible dimensions",
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
  };

  var advanced = {
    ref: "prop.advanced",
    label: "Advanced mode",
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
    defaultValue: false
  };

  var advancedMsg1 = {
    type: "string",
    component: "text",
    label: `When using advanced mode, you have the flexibility to choose where to insert set
      analysis and dimension values within the base master visualisation`,
    show: function (d) {
      return d.prop && d.prop.advanced;
    }
  };

  var advancedMsg2 = {
    type: "string",
    component: "text",
    label: "$(vDimSetFull) will insert '{<dimensionName={'dimensionValue'}>}'",
    show: function (d) {
      return d.prop && d.prop.advanced;
    }
  };

  var advancedMsg3 = {
    type: "string",
    component: "text",
    label: "\n $(vDimSet) will insert 'dimensionName={'dimensionValue'},' ",
    show: function (d) {
      return d.prop && d.prop.advanced;
    }
  };

  var advancedMsg4 = {
    type: "string",
    component: "text",
    label: "\n $(vDim) will insert 'dimensionName'",
    show: function (d) {
      return d.prop && d.prop.advanced;
    }
  };

  var advancedMsg5 = {
    type: "string",
    component: "text",
    label: "\n $(vDimValue) will insert 'dimensionValue'",
    show: function (d) {
      return d.prop && d.prop.advanced;
    }
  };

  var appearance = {
    uses: "settings",
    items: {
      general: {
        items: {
          showTitles: {
            defaultValue: false
          },
          details: {
            show: false
          }
        }
      },
      options: {
        type: "items",
        label: "Trellis options",
        items: {
          link: link,
          col: colNum,
          maxCharts: maxCharts,
          label: label,
          labelMes: labelMes,
          showAllDimensionValues: showAllDimensionValues,
          border: border,
          borderWidth: borderWidth,
          borderColor: borderColor,
          borderStyle: borderStyle,
          customBorderSwitch: customBorderSwitch,
          customBorder: customBorder,
          autoRange: autoRange,
          slideMode: slideMode,
          advanced: advanced,
          advancedMsg1: advancedMsg1,
          advancedMsg2: advancedMsg2,
          advancedMsg3: advancedMsg3,
          advancedMsg4: advancedMsg4,
          advancedMsg5: advancedMsg5
        }
      }
    }
  };

  var aboutDefinition = {
    component: 'items',
    label: 'About',
    items: {
      header: {
        label: 'Trellis',
        style: 'header',
        component: 'text'
      },
      paragraph1: {
        label: `Trellis container is a Qlik Sense chart which allows you to create a trellis
          chart object based on an existing master visualization.`,
        component: 'text'
      },
      paragraph2: {
        label: 'Trellis container is based upon an extension created by Riley MacDonald.',
        component: 'text'
      }
    }
  };

  return {
    type: "items",
    component: "accordion",
    items: {
      data: data,
      sorting: sorting,
      appearance: appearance,
      about: aboutDefinition
    }
  };
});