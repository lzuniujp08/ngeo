goog.provide('app.mapquery');

/** @suppress {extraRequire} */
goog.require('ngeo.proj.EPSG21781');
goog.require('ngeo.DataSource');
goog.require('ngeo.DataSources');
goog.require('ngeo.ToolActivate');
goog.require('ngeo.ToolActivateMgr');
/** @suppress {extraRequire} */
goog.require('ngeo.btnDirective');
/** @suppress {extraRequire} */
goog.require('ngeo.mapDirective');
/** @suppress {extraRequire} */
goog.require('ngeo.mapQueryDirective');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.OSM');


/** @type {!angular.Module} **/
app.module = angular.module('app', ['ngeo']);


app.module.value('ngeoQueryOptions', {
  'limit': 20
});


/**
 * A sample directive to display the result.
 *
 * @return {angular.Directive} The directive specs.
 * @ngInject
 */
app.queryresultDirective = function() {
  return {
    restrict: 'E',
    scope: {},
    controller: 'AppQueryresultController as qrCtrl',
    bindToController: true,
    templateUrl: 'partials/queryresult.html'
  };
};

app.module.directive('appQueryresult', app.queryresultDirective);


/**
 * @param {ngeox.QueryResult} ngeoQueryResult The ngeo query service.
 * @constructor
 * @ngInject
 */
app.QueryresultController = function(ngeoQueryResult) {

  /**
   * @type {ngeox.QueryResult}
   * @export
   */
  this.result = ngeoQueryResult;

};


app.module.controller('AppQueryresultController', app.QueryresultController);


/**
 * @param {angular.Scope} $scope Scope.
 * @param {ngeo.DataSources} ngeoDataSources Ngeo collection of data sources
 *     objects.
 * @param {ngeo.ToolActivateMgr} ngeoToolActivateMgr The ngeo ToolActivate
 *     manager.
 * @constructor
 * @ngInject
 */
app.MainController = function($scope, ngeoDataSources, ngeoToolActivateMgr) {

  /**
   * @type {boolean}
   * @export
   */
  this.dummyActive = false;

  /**
   * @type {boolean}
   * @export
   */
  this.queryActive = true;

  ngeoDataSources.push(new ngeo.DataSource({
    id: 1,
    name: 'bus_stop',
    visible: true,
    wmsUrl: 'https://geomapfish-demo.camptocamp.net/2.2/wsgi/mapserv_proxy',
    ogcLayers: [{
      name: 'bus_stop',
      queryable: true
    }]
  }));
  const busStopLayer = new ol.layer.Image({
    'source': new ol.source.ImageWMS({
      'url': 'https://geomapfish-demo.camptocamp.net/2.2/wsgi/mapserv_proxy',
      params: {'LAYERS': 'bus_stop'}
    })
  });

  ngeoDataSources.push(new ngeo.DataSource({
    id: 2,
    name: 'information',
    visible: true,
    wmsUrl: 'https://geomapfish-demo.camptocamp.net/2.2/wsgi/mapserv_proxy',
    ogcLayers: [{
      name: 'information',
      queryable: true
    }]
  }));
  const informationLayer = new ol.layer.Image({
    'source': new ol.source.ImageWMS({
      'url': 'https://geomapfish-demo.camptocamp.net/2.2/wsgi/mapserv_proxy',
      params: {'LAYERS': 'information'}
    })
  });

  /**
   * @type {ol.Map}
   * @export
   */
  this.map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      }),
      informationLayer,
      busStopLayer
    ],
    view: new ol.View({
      projection: 'EPSG:21781',
      resolutions: [200, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5],
      center: [537635, 152640],
      zoom: 0
    })
  });

  const queryToolActivate = new ngeo.ToolActivate(this, 'queryActive');
  ngeoToolActivateMgr.registerTool('mapTools', queryToolActivate, true);

  const dummyToolActivate = new ngeo.ToolActivate(this, 'dummyActive');
  ngeoToolActivateMgr.registerTool('mapTools', dummyToolActivate);

};


/**
 * @param {boolean|undefined} val Value.
 * @return {boolean|undefined} Value.
 * @export
 */
app.MainController.prototype.getSetDummyActive = function(val) {
  if (val !== undefined) {
    this.dummyActive = val;
  } else {
    return this.dummyActive;
  }
};


app.module.controller('MainController', app.MainController);
