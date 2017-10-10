// TODO - MaxScaleDenominator
// TODO - MinScaleDenominator

goog.provide('gmf.datasource.ExternalDataSourcesManager');

goog.require('gmf');
goog.require('gmf.datasource.OGC');
goog.require('ngeo.datasource.DataSources');


gmf.datasource.ExternalDataSourcesManager = class {

  /**
   * External data sources come remote online resources, such as WMS/WMTS
   * servers, and also files such as KML/GXP. This service is responsible of
   * creating, storing and managing them.
   *
   * @param {!angular.$injector} $injector Main injector.
   * @param {!angular.Scope} $rootScope The rootScope provider.
   * @param {!ngeo.datasource.DataSources} ngeoDataSources Ngeo collection of
   *     data sources objects.
   * @param {!ngeo.LayerHelper} ngeoLayerHelper Ngeo layer helper service
   * @struct
   * @ngInject
   * @ngdoc service
   * @ngname gmfExternalDataSourcesManager
   */
  constructor($injector, $rootScope, ngeoDataSources, ngeoLayerHelper) {

    // === Injected properties ===

    /**
     * @type {angular.Scope}
     * @private
     */
    this.rootScope_ = $rootScope;

    /**
     * The collection of DataSources from ngeo. When this service creates
     * a data source, its gets added to that collection.
     * @type {!ngeo.datasource.DataSources}
     * @private
     */
    this.ngeoDataSources_ = ngeoDataSources;

    /**
     * @type {!ngeo.LayerHelper}
     * @private
     */
    this.ngeoLayerHelper_ = ngeoLayerHelper;


    // === Inner properties ===

    /**
     * All external data sources that are created are stored here. The key
     * is the data source id.
     * @type {Object.<number, gmf.datasource.OGC>}
     * @private
     */
    this.extDataSources_ = {};

    /**
     * @type {?ol.Map}
     * @private
     */
    this.map_ = null;

    /**
     * @type {!Object.<string, !gmfx.ExternalOGCServer>}
     * @private
     */
    this.wmsServers_ = {};

    const servers = /** @type {Array.<!gmfx.ExternalOGCServer>|undefined} */ (
      $injector.get('gmfExternalOGCServers'));

    if (servers) {
      for (const server of servers) {
        if (server.type === 'WMS') {
          this.wmsServers_[server.name] = server;
        }
      }
    }

    /**
     * The functions to call to unregister the `watch` event on data sources
     * that are registered. Key is the id of the data source.
     * @type {!Object.<number, Function>}
     * @private
     */
    this.wmsDataSourceUnregister_ = {};

    /**
     * Collection of WMS groups.
     * @type {!ol.Collection.<!gmfx.datasource.WMSGroup>}
     * @private
     */
    this.wmsGroupsCollection_ = new ol.Collection();
  }

  /**
   * @param {gmfx.datasource.WMSGroup} wmsGroup WMS group.
   * @private
   */
  addWMSGroup_(wmsGroup) {
    this.wmsGroupsCollection.push(wmsGroup);
  }

  /**
   * @param {gmfx.datasource.WMSGroup} wmsGroup WMS group.
   * @private
   */
  removeWMSGroup_(wmsGroup) {
    this.wmsGroupsCollection.remove(wmsGroup);
  }

  /**
   * @return {ol.layer.Group} Layer group where to push layers created by
   *     this service.
   */
  get layerGroup() {
    const map = this.map_;
    goog.asserts.assert(map);
    return this.ngeoLayerHelper_.getGroupFromMap(
      map,
      gmf.EXTERNALLAYERGROUP_NAME
    );
  }

  /**
   * @param {string} url Online resource url
   * @return {?gmfx.datasource.WMSGroup} WMS group.
   */
  getWMSGroup(url) {
    let found = null;
    for (const wmsGroup of this.wmsGroups) {
      if (wmsGroup.url === url) {
        found = wmsGroup;
        break;
      }
    }
    return found;
  }

  /**
   * @return {!Array.<!gmfx.datasource.WMSGroup>} List of WMS groups.
   * @export
   */
  get wmsGroups() {
    return this.wmsGroupsCollection_.getArray();
  }


  /**
   * @return {!ol.Collection.<!gmfx.datasource.WMSGroup>} Collection of WMS
   *     groups.
   * @export
   */
  get wmsGroupsCollection() {
    return this.wmsGroupsCollection_;
  }


  /**
   * @param {?ol.Map} map Map
   */
  set map(map) {
    this.map_ = map;
  }

  /**
   * @param {ol.layer.Image} layer Layer.
   * @private
   */
  addLayer_(layer) {
    this.layerGroup.getLayers().push(layer);
  }

  /**
   * @param {ol.layer.Image} layer Layer.
   * @private
   */
  removeLayer_(layer) {
    this.layerGroup.getLayers().remove(layer);
  }

  /**
   * @param {!Object} layer WMS Capability Layer object.
   * @param {!Object} capabilities  WMS Capabilities definition
   * @export
   */
  createAndAddDataSourceFromWMSCapability(layer, capabilities) {

    const id = gmf.datasource.ExternalDataSourcesManager.getId(layer);

    // If a data source with the same id already exists, do nothing
    if (this.extDataSources_[id]) {
      return;
    }

    const service = capabilities['Service'];
    const req = capabilities['Capability']['Request'];

    // ogcImageType
    const formats = req['GetMap']['Format'];
    const imagePngType = 'image/png';
    const ogcImageType = formats.includes(imagePngType) ?
      imagePngType : formats[0];

    // wmsInfoFormat
    const infoFormats = req['GetFeatureInfo']['Format'];
    const wmsInfoFormat = infoFormats.includes(
      ngeo.datasource.OGC.WMSInfoFormat.GML
    ) ? ngeo.datasource.OGC.WMSInfoFormat.GML : undefined;

    // queryable
    const queryable = layer['queryable'] === true &&
          wmsInfoFormat !== undefined;

    // TODO - MaxScaleDenominator
    // TODO - MinScaleDenominator
    const dataSource = new gmf.datasource.OGC({
      id,
      name: layer['Title'],
      ogcImageType,
      ogcLayers: [{
        name: layer['Name'],
        queryable
      }],
      ogcType: ngeo.datasource.OGC.Type.WMS,
      visible: true,
      wmsInfoFormat,
      wmsUrl: service['OnlineResource']
    });

    // Keep a reference to the external data source in the cache
    this.extDataSources_[id] = dataSource;

    // Add the data source
    this.ngeoDataSources_.push(dataSource);

    // Create or add service
    this.registerWMSDataSource_(service, dataSource);
  }


  /**
   * @param {!Object} service Service
   * @param {!gmf.datasource.OGC} dataSource OGC data source.
   * @private
   */
  registerWMSDataSource_(service, dataSource) {

    const url = service['OnlineResource'];
    const title = service['Title'];
    const id = dataSource.id;
    let layer;
    let shouldUpdate = false;

    let wmsGroup = this.getWMSGroup(url);

    if (wmsGroup) {
      layer = wmsGroup.layer;
      layer.get('querySourceIds').push(id);
    } else {
      layer = this.ngeoLayerHelper_.createBasicWMSLayerFromDataSource(
        dataSource
      );
      wmsGroup = {
        dataSources: [dataSource],
        layer,
        service,
        title,
        url
      };

      shouldUpdate = true;

      this.addLayer_(layer);

      this.addWMSGroup_(wmsGroup);
    }

    this.wmsDataSourceUnregister_[id] = this.rootScope_.$watch(
      dataSource.visible,
      this.handleWMSDataSourceVisibleChange_.bind(this, dataSource)
    );

    if (shouldUpdate) {
      this.updateWMSGroupLayer_(wmsGroup);
    }
  }

  /**
   * @param {!gmf.datasource.OGC} dataSource OGC data source.
   * @private
   */
  unregisterWMSDataSource_(dataSource) {
    const url = dataSource.wmsUrl;
    goog.asserts.assert(url);

    const wmsGroup = this.getWMSGroup(url);
    goog.asserts.assert(wmsGroup);
    const id = dataSource.id;
    const layer = wmsGroup.layer;

    // Remove id reference from layer
    ol.array.remove(layer.get('querySourceIds'), id);

    // Unregister watcher
    const unregister = this.wmsDataSourceUnregister_[id];
    unregister();
    delete this.wmsDataSourceUnregister_[id];

    // Remove DS from the group
    ol.array.remove(wmsGroup.dataSources, dataSource);

    // Remove from the cache
    delete this.extDataSources_[id];

    if (wmsGroup.layers.length) {
      // Force update of the group
      this.updateWMSGroupLayer_(wmsGroup);
    } else {
      // If we removed the last data source, then get rid of the group as well
      // and remove the layer
      this.removeLayer(wmsGroup.layer);
      this.removeWMSGroup_(wmsGroup);
    }
  }

  /**
   * @param {ngeo.datasource.OGC} dataSource OGC data source
   * @param {boolean|undefined} value Current visible property of the DS
   * @param {boolean|undefined} oldValue Old visible property of the DS
   * @private
   */
  handleWMSDataSourceVisibleChange_(dataSource, value, oldValue) {
    if (value !== undefined && value !== oldValue) {
      const url = dataSource.wmsUrl;
      goog.asserts.assert(url);
      const wmsGroup = this.getWMSGroup(url);
      goog.asserts.assert(wmsGroup);
      this.updateWMSGroupLayer_(wmsGroup);
    }
  }

  /**
   * @param {gmfx.datasource.WMSGroup} wmsGroup WMS group
   *     cache item.
   * @private
   */
  updateWMSGroupLayer_(wmsGroup) {
    const layer = wmsGroup.layer;
    let layerNames = [];

    // (1) Collect layer names from data sources in the group
    for (const dataSource of wmsGroup.dataSources) {
      if (dataSource.visible) {
        layerNames = layerNames.concat(dataSource.getOGCLayerNames());
      }
    }

    // (2) Update layer object
    this.ngeoLayerHelper_.updateWMSLayerState(layer, layerNames);
  }
};


/**
 * Get the data source id from a WMS Capability Layer object.
 *
 * Please, note that this is used to generate a unique id for the created
 * external data sources and since a WMS Capability Layer object doesn't
 * natively contains an id by itself, then it is programatically generated
 * using the `ol.getUid` method, plus a million.
 *
 * @param {!Object} layer WMS Capability Layer object.
 * @return {number} Data source id.
 * @export
 */
gmf.datasource.ExternalDataSourcesManager.getId = function(layer) {
  return ol.getUid(layer) + 1000000;
};


gmf.module.service(
  'gmfExternalDataSourcesManager', gmf.datasource.ExternalDataSourcesManager);
