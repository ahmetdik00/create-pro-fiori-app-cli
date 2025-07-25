sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "<%= namespace %>/model/models",
    "<%= namespace %>/service/ODataV2Service", // Yeni V2 Servisimiz
    "<%= namespace %>/service/ODataV4Service", // Yeni V4 Servisimiz
  ],
  function (UIComponent, models, ODataV2Service, ODataV4Service) {
    "use strict";

    return UIComponent.extend("<%= namespace %>.Component", {
      metadata: {
        manifest: "json",
      },

      init: function () {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // OData V2 servisini başlat ve component'e ekle
        this.oDataV2Service = new ODataV2Service(this.getModel("oDataV2Model"));

        // OData V4 servisini başlat ve component'e ekle
        this.oDataV4Service = new ODataV4Service(this.getModel("oDataV4Model"));

        // enable routing
        this.getRouter().initialize();

        // set the device model
        this.setModel(models.createDeviceModel(), "device");
      },

      /**
       * Uygulama genelinde OData V2 servisine erişim sağlar.
       * @returns {ilbak_srm.service.ODataV2Service} The OData V2 service instance.
       */
      getODataV2Service: function () {
        return this.oDataV2Service;
      },

      /**
       * Uygulama genelinde OData V4 servisine erişim sağlar.
       * @returns {ilbak_srm.service.ODataV4Service} The OData V4 service instance.
       */
      getODataV4Service: function () {
        return this.oDataV4Service;
      },
    });
  }
);
