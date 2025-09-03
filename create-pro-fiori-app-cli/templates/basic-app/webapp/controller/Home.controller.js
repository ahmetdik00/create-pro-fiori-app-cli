sap.ui.define(["sap/ui/core/mvc/Controller", "../util/Formatter"], function (Controller, Formatter) {
  "use strict";

  /* ---------------------------------------------------------------------------------------------- */
  /*                                           global sap                                           */
  /* ---------------------------------------------------------------------------------------------- */

  return Controller.extend("<%= namespace %>.controller.Home", {
    formatter: Formatter,
    /**
     * @brief Controller ilk yüklendiğinde bir kez çalışır.
     * Olay dinleyicilerini ve sabit referansları tanımlamak için kullanılır.
     */
    onInit: function () {},
  });
});
